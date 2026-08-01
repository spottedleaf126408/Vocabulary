export const WORD_FIELDS = [
  ['chinese_word', 'Chinese word', '決定'],
  ['english_word', 'English word', 'decide'],
  ['part_of_speech', 'Part of speech (optional)', 'v.'],
  ['phrase_en', 'Phrase (English, optional)', 'decide on something'],
  ['phrase_zh', "Phrase's Chinese meaning", '決定去做某事'],
  ['example_sentence_en', 'Example sentence (EN)', 'I decided to go to the doctor.'],
  ['example_sentence_zh', "Example sentence's Chinese meaning", '我決定去看醫生。'],
  ['word_family', 'Word family (optional)', 'decide, decisive, decision'],
  ['tag_unit', 'Tag / unit (optional)', 'Unit 3']
];

export const EMPTY_WORD = Object.fromEntries(WORD_FIELDS.map(([key]) => [key, '']));
