/* global expect, it, describe */

import createMigrationMessage from './createMigrationMessage';

describe('sniffer/createMigrationMessage', () => {
  it('should show no migration message', () => {
    expect(
      createMigrationMessage({
        added: [],
        updated: [],
        deleted: [],
      })
    ).toMatchInlineSnapshot(`"No migration impact 😢"`);
  });

  it('should warn about using angular deps', () => {
    expect(
      createMigrationMessage({
        added: [
          {
            path: 'src/path/to-file.js',
            right: {
              js: true,
              angular: ['$state', '$timeout'],
            },
          },
          {
            path: 'src/path/to-jade-file.jade',
            right: {
              jade: true,
            },
          },
        ],
        deleted: [],
        updated: [
          {
            path: 'src/path/to-updated-file.js',
            left: {
              js: true,
              angular: ['$state', 'spaceContext'],
              needsRefactoring: ['ui/Framework'],
            },
            right: {
              js: true,
              angular: ['$state', '$timeout'],
              needsRefactoring: ['hyperscript'],
            },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<details><summary>More details</summary>

      ### Could be better

      \`src/path/to-file.js\`

      Avoid using the following dependencies:
      * \`$state\`
      * \`$timeout\`

      \`src/path/to-jade-file.jade\`

      Don't create new \`.jade\` files.

      \`src/path/to-updated-file.js\`

      Avoid using the following dependencies:
      * \`$state\`
      * \`$timeout\`
      * \`hyperscript\`

      </details>"
    `);
  });
});
