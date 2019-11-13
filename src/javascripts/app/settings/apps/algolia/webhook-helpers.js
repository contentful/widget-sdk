export const helpers = [
  {
    key: 'first-chars',
    title: 'First n chars',
    param: 'Number',
    placeholder: 'Number of characters (required)'
  },
  {
    key: 'first-words',
    title: 'First n words',
    param: 'Number',
    placeholder: 'Number of words (required)'
  },
  {
    key: 'first-paragraphs',
    title: 'First n paragraphs',
    param: 'Number',
    placeholder: 'Number of n paragraphs (required)'
  },
  { key: 'strip-stop-words', title: 'Strip stop words' },
  { key: 'strip-markdown', title: 'Strip markdown' }
];

export function getHelperByKey(key) {
  return helpers.find(helper => helper.key === key);
}
