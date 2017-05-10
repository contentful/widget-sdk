'use strict';

describe('EntityHelpers', function () {
  const REWRITTEN_URL = 'http://rewritten.url/file.txt';
  const throwingFn = () => { throw new Error('Should not end up here!'); };

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('assetUrlFilter', _.constant(REWRITTEN_URL));
    });

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.helpers = this.$inject('EntityHelpers').newForLocale('en-US');
  });

  describe('#assetFileUrl', function () {
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
});
