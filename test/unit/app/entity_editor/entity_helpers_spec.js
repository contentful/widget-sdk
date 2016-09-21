'use strict';

describe('EntityHelpers', function () {
  const REWRITTEN_URL = 'http://rewritten.url/file.txt';
  const throwingFn = () => { throw new Error('Should not end up here!'); };

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('assetUrlFilter', _.constant(REWRITTEN_URL));
    });

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.entityStatus = this.mockService('entityStatus');
    this.helpers = this.$inject('EntityHelpers').api;
  });

  describe('#entityStatus', function () {
    itGetsEntityStatus('published', {publishedVersion: 123}, [true, false, false]);
    itGetsEntityStatus('changed', {publishedVersion: 100, version: 200}, [true, true, false]);
    itGetsEntityStatus('archived', {archivedVersion: 123}, [false, true, true]);

    function itGetsEntityStatus (status, sys, expectations) {
      pit(`gets status for ${status} entity`, function () {
        return this.helpers.entityStatus({sys: sys}).then(() => {
          sinon.assert.calledOnce(this.entityStatus.getClassname);
          const [entity] = this.entityStatus.getClassname.firstCall.args;
          expect(entity.isPublished()).toBe(expectations[0]);
          expect(entity.hasUnpublishedChanges()).toBe(expectations[1]);
          expect(entity.isArchived()).toBe(expectations[2]);
        });
      });
    }
  });

  describe('#assetUrl', function () {
    const fileEn = {};
    const entity = {
      fields: {test: {}, file: {'en-US': fileEn, 'de-DE': {}}}
    };

    pit('rejects if the file object cannot be found', function () {
      return this.helpers.assetFile(entity, 'en-GB').then(throwingFn, _.noop);
    });

    pit('resolves with file field for a specific locale', function () {
      return this.helpers.assetFile(entity, 'en-US').then((file) => {
        expect(file).toBe(fileEn);
      });
    });
  });

  describe('#assetFileUrl', function () {
    pit('rejects if invalid file is provided', function () {
      return this.helpers.assetFileUrl({}).then(throwingFn, _.noop);
    });

    pit('resolves with URL', function () {
      return this.helpers.assetFileUrl({url: 'http://some.url/file.txt'})
      .then((url) => { expect(url).toBe(REWRITTEN_URL); });
    });
  });

  itConvertsToEntityAndCallsMethod('entityTitle');
  itConvertsToEntityAndCallsMethod('entityDescription');
  itConvertsToEntityAndCallsMethod('entryImage');

  function itConvertsToEntityAndCallsMethod (methodName) {
    pit(`converts data to entity and calls #${methodName}`, function () {
      this.spaceContext.publishedCTs.fetch.resolves({
        data: {fields: [{apiName: 'test', id: 'realid'}]}
      });

      return this.helpers[methodName]({
        sys: {type: 'Entry', contentType: {sys: {id: 'ctid'}}},
        fields: {test: {}}
      }, 'en-US').then(() => {
        sinon.assert.calledOnce(this.spaceContext[methodName]);
        const [entity, locale] = this.spaceContext[methodName].firstCall.args;

        expect(entity.data.fields).toEqual({realid: {}});
        expect(entity.getType()).toBe('Entry');
        expect(entity.getContentTypeId()).toBe('ctid');
        expect(locale).toBe('en-US');
      });
    });
  }
});
