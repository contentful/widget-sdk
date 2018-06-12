import { uniq } from 'lodash';

describe('widgets/builtin', () => {
  beforeEach(function () {
    module('contentful/test');

    this.create = this.$inject('widgets/builtin').create;
  });

  describe('create()', () => {
    it('returns a list of widget descriptors', function () {
      const expectedProperties = jasmine.objectContaining({
        id: jasmine.any(String),
        name: jasmine.any(String),
        template: jasmine.any(String),
        fieldTypes: jasmine.any(Array)
      });
      this.create().forEach((widgetDescriptor) => {
        expect(widgetDescriptor).toEqual(expectedProperties);
      });
    });

    // This asserts that we can put the builtin widget ids into the
    // editing interface payload and it is validated by the CMA.
    // https://github.com/contentful/content_api/blob/master/lib/handler/constraints/management/schemas/content-type.js#L46-L51
    it('returns a valid resource ID for each widget descriptor', function () {
      this.create().forEach(({id}) => expectValidCmaId(id));
    });

    it('returns no widget descriptors with duplicate ID', function () {
      const ids = this.create().map(({id}) => id);
      expect(ids).toEqual(uniq(ids));
    });
  });
});

function expectValidCmaId (id) {
  const ID_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;
  expect(id).toMatch(ID_RE);
}
