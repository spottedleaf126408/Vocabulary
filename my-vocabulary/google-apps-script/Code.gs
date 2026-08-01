/**
 * My Vocabulary — Google Apps Script backend
 *
 * SETUP (do this once):
 * 1. Open your Google Sheet (this will hold all student data).
 * 2. Extensions > Apps Script.
 * 3. Delete any starter code, paste this entire file in.
 * 4. In the function dropdown at the top, select "setup" and click Run.
 *    This creates the Jie / Fay / Huna tabs (+ their _Stats tabs) with the
 *    right headers, if they don't already exist. Safe to re-run any time.
 * 5. Deploy > New deployment > type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click Deploy, authorize when prompted, and copy the Web app URL.
 * 6. That URL is what the frontend calls. Send it back to Claude along with
 *    this Sheet's tab names if you changed anything.
 *
 * Adding a 4th student later: add their name to STUDENTS below, run setup()
 * again, and give the frontend their PIN + theme. Existing students'
 * tabs/data are untouched.
 */

const STUDENTS = ['Jie', 'Fay', 'Huna'];

const WORD_COLUMNS = [
  'id', 'chinese_word', 'english_word', 'part_of_speech',
  'phrase_en', 'phrase_zh',
  'example_sentence_en', 'example_sentence_zh',
  'word_family', 'tag_unit',
  'date_added', 'added_by',
  'familiarity', 'last_reviewed',
  'times_correct', 'times_incorrect',
  'mastered_bonus_given', 'notes'
];

const STATS_COLUMNS = ['xp', 'streak', 'longest_streak', 'last_active_date', 'badges'];

// XP amounts — see design spec section 4 for rationale.
const XP = {
  ADD_WORD: 2,
  REVIEW_CARD: 1,
  REVIEW_CARD_DAILY_CAP: 20,
  QUIZ_CORRECT_HARD: 5,   // word was New/Learning
  QUIZ_CORRECT_EASY: 3,   // word was Familiar/Confident/Mastered
  QUIZ_PERFECT_BONUS: 10,
  MASTERED_BONUS: 15,
  STREAK_PER_DAY: 5,
  STREAK_CAP: 50
};

// ---------- HTTP entry points ----------

function doGet(e) {
  try {
    const action = e.parameter.action;
    const student = e.parameter.student;

    if (action === 'getWords') {
      return jsonOut_({ words: getWords_(requireStudent_(student)) });
    }
    if (action === 'getStats') {
      return jsonOut_({ stats: getStats_(requireStudent_(student)) });
    }
    return jsonOut_({ error: 'Unknown or missing action for GET: ' + action });
  } catch (err) {
    return jsonOut_({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const student = requireStudent_(body.student);

    switch (action) {
      case 'addWord':
        return jsonOut_({ word: addWord_(student, body.word || {}) });
      case 'updateWord':
        return jsonOut_({ word: updateWord_(student, body.id, body.updates || {}) });
      case 'deleteWord':
        deleteWord_(student, body.id);
        return jsonOut_({ success: true });
      case 'reviewWord':
        return jsonOut_({ word: reviewWord_(student, body.id, body.delta), stats: getStats_(student) });
      case 'quizAnswer':
        return jsonOut_({
          word: quizAnswer_(student, body.id, !!body.correct, !!body.demote),
          stats: getStats_(student)
        });
      case 'quizComplete':
        return jsonOut_({ stats: quizComplete_(student, body.score, body.total) });
      default:
        return jsonOut_({ error: 'Unknown action for POST: ' + action });
    }
  } catch (err) {
    return jsonOut_({ error: String(err) });
  }
}

// ---------- Word CRUD ----------

function getWords_(student) {
  const sheet = getWordSheet_(student);
  const rows = sheet.getDataRange().getValues();
  const header = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue; // skip blank rows
    out.push(rowToObject_(header, rows[i]));
  }
  return out;
}

function addWord_(student, word) {
  const sheet = getWordSheet_(student);
  const id = Utilities.getUuid();
  const today = todayStr_();
  const row = WORD_COLUMNS.map(function (col) {
    if (col === 'id') return id;
    if (col === 'date_added') return today;
    if (col === 'familiarity') return 0;
    if (col === 'last_reviewed') return '';
    if (col === 'times_correct') return 0;
    if (col === 'times_incorrect') return 0;
    if (col === 'mastered_bonus_given') return false;
    return word[col] !== undefined ? word[col] : '';
  });
  sheet.appendRow(row);
  awardXP_(student, XP.ADD_WORD);
  touchStreak_(student);
  return rowToObject_(WORD_COLUMNS, row);
}

function updateWord_(student, id, updates) {
  const sheet = getWordSheet_(student);
  const found = findRowById_(sheet, id);
  if (!found) throw new Error('Word not found: ' + id);
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  WORD_COLUMNS.forEach(function (col) {
    if (updates[col] === undefined) return;
    const colIndex = header.indexOf(col) + 1;
    if (colIndex > 0) sheet.getRange(found.rowIndex, colIndex).setValue(updates[col]);
  });

  const updatedRow = sheet.getRange(found.rowIndex, 1, 1, header.length).getValues()[0];
  return rowToObject_(header, updatedRow);
}

function deleteWord_(student, id) {
  const sheet = getWordSheet_(student);
  const found = findRowById_(sheet, id);
  if (!found) throw new Error('Word not found: ' + id);
  sheet.deleteRow(found.rowIndex);
}

// Flashcard self-rating: delta is -1 (Again), 0 (Hard), +1 (Good/Easy).
// This is the ONLY place familiarity changes directly from a rating.
function reviewWord_(student, id, delta) {
  const sheet = getWordSheet_(student);
  const found = findRowById_(sheet, id);
  if (!found) throw new Error('Word not found: ' + id);
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const famCol = header.indexOf('familiarity') + 1;
  const lastReviewedCol = header.indexOf('last_reviewed') + 1;
  const masteredCol = header.indexOf('mastered_bonus_given') + 1;

  const oldFam = Number(sheet.getRange(found.rowIndex, famCol).getValue()) || 0;
  const newFam = Math.max(0, Math.min(4, oldFam + Number(delta || 0)));
  sheet.getRange(found.rowIndex, famCol).setValue(newFam);
  sheet.getRange(found.rowIndex, lastReviewedCol).setValue(todayStr_());

  maybeAwardMasteryBonus_(sheet, found.rowIndex, masteredCol, oldFam, newFam, student);

  const dailyReviewXP = capDailyReviewXP_(student, XP.REVIEW_CARD);
  if (dailyReviewXP > 0) awardXP_(student, dailyReviewXP);
  touchStreak_(student);

  const updatedRow = sheet.getRange(found.rowIndex, 1, 1, header.length).getValues()[0];
  return rowToObject_(header, updatedRow);
}

// Quiz answer: correct -> familiarity untouched, just XP + times_correct.
// Incorrect -> times_incorrect, and only demotes familiarity if the caller
// confirmed (the frontend asks the student first).
function quizAnswer_(student, id, correct, demote) {
  const sheet = getWordSheet_(student);
  const found = findRowById_(sheet, id);
  if (!found) throw new Error('Word not found: ' + id);
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const famCol = header.indexOf('familiarity') + 1;
  const correctCol = header.indexOf('times_correct') + 1;
  const incorrectCol = header.indexOf('times_incorrect') + 1;

  const fam = Number(sheet.getRange(found.rowIndex, famCol).getValue()) || 0;

  if (correct) {
    sheet.getRange(found.rowIndex, correctCol).setValue(
      Number(sheet.getRange(found.rowIndex, correctCol).getValue() || 0) + 1
    );
    awardXP_(student, fam <= 1 ? XP.QUIZ_CORRECT_HARD : XP.QUIZ_CORRECT_EASY);
    touchStreak_(student);
  } else {
    sheet.getRange(found.rowIndex, incorrectCol).setValue(
      Number(sheet.getRange(found.rowIndex, incorrectCol).getValue() || 0) + 1
    );
    if (demote && fam > 0) {
      sheet.getRange(found.rowIndex, famCol).setValue(fam - 1);
    }
  }

  const updatedRow = sheet.getRange(found.rowIndex, 1, 1, header.length).getValues()[0];
  return rowToObject_(header, updatedRow);
}

function quizComplete_(student, score, total) {
  if (total > 0 && score === total) {
    awardXP_(student, XP.QUIZ_PERFECT_BONUS);
  }
  return getStats_(student);
}

// ---------- Stats / XP / streak / level ----------

function getStats_(student) {
  const sheet = getStatsSheet_(student);
  const row = sheet.getRange(2, 1, 1, STATS_COLUMNS.length).getValues()[0];
  const raw = rowToObject_(STATS_COLUMNS, row);
  const xp = Number(raw.xp) || 0;
  const levelInfo = computeLevel_(xp);
  return {
    xp: xp,
    level: levelInfo.level,
    xpIntoLevel: levelInfo.xpIntoLevel,
    xpForNextLevel: levelInfo.xpForNextLevel,
    streak: Number(raw.streak) || 0,
    longestStreak: Number(raw.longest_streak) || 0,
    lastActiveDate: raw.last_active_date || '',
    badges: raw.badges ? String(raw.badges).split(',').filter(Boolean) : []
  };
}

function awardXP_(student, amount) {
  if (!amount) return;
  const sheet = getStatsSheet_(student);
  const cell = sheet.getRange(2, STATS_COLUMNS.indexOf('xp') + 1);
  cell.setValue((Number(cell.getValue()) || 0) + amount);
}

// Call on any XP-earning action. Awards the "first activity of the day"
// streak bonus at most once per day, and keeps streak/longest_streak current.
function touchStreak_(student) {
  const sheet = getStatsSheet_(student);
  const lastActiveCell = sheet.getRange(2, STATS_COLUMNS.indexOf('last_active_date') + 1);
  const streakCell = sheet.getRange(2, STATS_COLUMNS.indexOf('streak') + 1);
  const longestCell = sheet.getRange(2, STATS_COLUMNS.indexOf('longest_streak') + 1);

  const today = todayStr_();
  const lastActive = lastActiveCell.getValue();
  if (lastActive === today) return; // already counted today

  const yesterday = Utilities.formatDate(
    new Date(Date.now() - 86400000), Session.getScriptTimeZone(), 'yyyy-MM-dd'
  );
  const currentStreak = Number(streakCell.getValue()) || 0;
  const newStreak = lastActive === yesterday ? currentStreak + 1 : 1;

  streakCell.setValue(newStreak);
  lastActiveCell.setValue(today);
  longestCell.setValue(Math.max(Number(longestCell.getValue()) || 0, newStreak));

  awardXP_(student, Math.min(XP.STREAK_PER_DAY * newStreak, XP.STREAK_CAP));
}

function maybeAwardMasteryBonus_(sheet, rowIndex, masteredCol, oldFam, newFam, student) {
  if (newFam === 4 && oldFam !== 4) {
    const alreadyGiven = sheet.getRange(rowIndex, masteredCol).getValue();
    if (!alreadyGiven) {
      awardXP_(student, XP.MASTERED_BONUS);
      sheet.getRange(rowIndex, masteredCol).setValue(true);
    }
  }
}

// Caps flashcard-review XP at XP.REVIEW_CARD_DAILY_CAP per day, tracked via
// a lightweight per-day counter stored in Script Properties (not the sheet,
// so it doesn't clutter your data).
function capDailyReviewXP_(student, amount) {
  const props = PropertiesService.getScriptProperties();
  const key = 'reviewxp_' + student + '_' + todayStr_();
  const usedToday = Number(props.getProperty(key)) || 0;
  if (usedToday >= XP.REVIEW_CARD_DAILY_CAP) return 0;
  const grant = Math.min(amount, XP.REVIEW_CARD_DAILY_CAP - usedToday);
  props.setProperty(key, String(usedToday + grant));
  return grant;
}

// Level thresholds grow by +25 XP each level (50, 75, 100, 125, ...).
function computeLevel_(totalXp) {
  let level = 1;
  let remaining = totalXp;
  let gap = 50;
  while (remaining >= gap) {
    remaining -= gap;
    level += 1;
    gap += 25;
  }
  return { level: level, xpIntoLevel: remaining, xpForNextLevel: gap };
}

// ---------- Sheet helpers ----------

function requireStudent_(student) {
  if (STUDENTS.indexOf(student) === -1) {
    throw new Error('Unknown student: ' + student);
  }
  return student;
}

function getWordSheet_(student) {
  return getOrCreateSheet_(student, WORD_COLUMNS);
}

function getStatsSheet_(student) {
  const sheet = getOrCreateSheet_(student + '_Stats', STATS_COLUMNS);
  // Ensure a single data row (row 2) always exists with sane defaults.
  if (sheet.getLastRow() < 2) {
    sheet.appendRow([0, 0, 0, '', '']);
  }
  return sheet;
}

function getOrCreateSheet_(name, columns) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(columns);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRowById_(sheet, id) {
  const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return { rowIndex: i + 2 };
  }
  return null;
}

function rowToObject_(header, row) {
  const obj = {};
  header.forEach(function (col, i) { obj[col] = row[i]; });
  return obj;
}

function todayStr_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- One-time setup ----------

function setup() {
  STUDENTS.forEach(function (student) {
    getWordSheet_(student);
    getStatsSheet_(student);
  });
  Logger.log('Setup complete. Tabs ready for: ' + STUDENTS.join(', '));
}
