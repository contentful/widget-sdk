import { uniq } from 'lodash';

describe('widgets/builtin', () => {
  beforeEach(function() {
    module('contentful/test');

    this.create = this.$inject('widgets/builtin').create;
  });

  describe('create()', () => {
    it('returns a list of widget descriptors', function() {
      const expectedProperties = jasmine.objectContaining({
        id: jasmine.any(String),
        name: jasmine.any(String),
        template: jasmine.any(String),
        fieldTypes: jasmine.any(Array)
      });
      this.create().forEach(widgetDescriptor => {
        expect(widgetDescriptor).toEqual(expectedProperties);
      });
    });

    // This asserts that we can put the builtin widget ids into the
    // editing interface payload and it is validated by the CMA.
    it('returns a valid resource ID for each widget descriptor', function() {
      this.create().forEach(({ id }) => expectValidCmaId(id));
    });

    it('returns no widget descriptors with duplicate ID', function() {
      const ids = this.create().map(({ id }) => id);
      expect(ids).toEqual(uniq(ids));
    });
  });
});

function expectValidCmaId(id) {
  // Regex is based on the CMA's ID validation + limited to 64 characters:
  // https://github.com/contentful/content_api/blob/88aa60a/lib/handler/constraints/management/schemas/id.js
  const ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9-_]{0,63}$/;
  expect(id).toMatch(ID_RE);
}
