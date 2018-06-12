'use strict';

describe('EntityHelpers', () => {
  const REWRITTEN_URL = 'http://rewritten.url/file.txt';
  const throwingFn = () => { throw new Error('Should not end up here!'); };

  beforeEach(function () {
    module('contentful/test', $provide => {
      $provide.value('assetUrlFilter', _.constant(REWRITTEN_URL));
    });

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.EntityHelpers = this.$inject('EntityHelpers');
    this.helpers = this.EntityHelpers.newForLocale('en-US');
  });

  describe('#assetFileUrl', () => {
    it('rejects if invalid file is provided', function* () {
      yield this.helpers.assetFileUrl({}).then(throwingFn, _.noop);
    });

    it('resolves with URL', function* () {
      const url = yield this.helpers.assetFileUrl({url: 'http://some.url/file.txt'});
      expect(url).toBe(REWRITTEN_URL);
    });
  });

  itConvertsToEntityAndCallsMethod('entityTitle');
  itConvertsToEntityAndCallsMethod('entityDescription');
  itConvertsToEntityAndCallsMethod('entryImage');

  function itConvertsToEntityAndCallsMethod (methodName) {
    it(`converts data to entity and calls #${methodName}`, function* () {
      this.spaceContext.publishedCTs.fetch.resolves({
        data: {fields: [{apiName: 'test', id: 'realid'}]}
      });

      yield this.helpers[methodName]({
        sys: {type: 'Entry', contentType: {sys: {id: 'ctid'}}},
        fields: {test: {}}
      });

      sinon.assert.calledOnce(this.spaceContext[methodName]);
      const [entity, locale] = this.spaceContext[methodName].firstCall.args;

      expect(entity.data.fields).toEqual({realid: {}});
      expect(entity.getType()).toBe('Entry');
      expect(entity.getContentTypeId()).toBe('ctid');
      expect(locale).toBe('en-US');
    });
  }

  describe('.contentTypeFieldLinkCtIds()', () => {
    beforeEach(function () {
      this.getIds = this.EntityHelpers.contentTypeFieldLinkCtIds;
    });

    it('returns valid IDs for `Link` field', function () {
      const ids = [ 'ID_1', 'ID_2' ];
      const field = newLinkField(ids);
      expect(this.getIds(field)).toEqual(ids);
    });

    it('returns empty array for `Link` field without validation', function () {
      const field = newLinkField();
      delete field.validations;
      expect(this.getIds(newLinkField())).toEqual([]);
    });

    it('returns valid IDs for `Array<Link>` field', function () {
      const ids = [ 'ID_FOO', 'ID_BAR' ];
      const field = newArrayField(newLinkField(ids));
      expect(this.getIds(field)).toEqual(ids);
    });

    it('returns empty array for `Array<Link>` field without validation', function () {
      const linksField = newLinkField();
      delete linksField.validations;
      const field = newArrayField(linksField);
      delete field.validations;
      expect(this.getIds(newLinkField())).toEqual([]);
    });

    function newArrayField (itemsField) {
      return {
        type: 'Array',
        items: itemsField,
        validations: []
      };
    }

    function newLinkField (ids) {
      return {
        type: 'Link',
        validations: [
          { someValidation: 'abc' },
          { linkContentType: ids || [] }
        ]
      };
    }
  });
});
