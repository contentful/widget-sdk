import _ from 'lodash';
import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';
import { beforeEach, it } from 'test/utils/dsl';

describe('EntityHelpers', () => {
  const REWRITTEN_URL = 'http://rewritten.url/file.txt';
  const INTERNAL_LOCALE_BY_LOCALE = {
    'en-US': 'en-US',
    de: 'de-internal'
  };
  const throwingFn = () => {
    throw new Error('Should not end up here!');
  };

  beforeEach(async function() {
    this.system.set('services/AssetUrlService.es6', {
      transformHostname: _.constant(REWRITTEN_URL)
    });
    this.system.set('services/localeStore.es6', {
      default: {
        toInternalCode: code => INTERNAL_LOCALE_BY_LOCALE[code]
      }
    });

    await $initialize(this.system);

    this.spaceContext = $inject('mocks/spaceContext').init();
    this.EntityHelpers = $inject('EntityHelpers');

    this.helpers = this.EntityHelpers.newForLocale('en-US');
  });

  describe('#assetFileUrl', () => {
    it('rejects if invalid file is provided', async function() {
      await this.helpers.assetFileUrl({}).then(throwingFn, _.noop);
    });

    it('resolves with URL', async function() {
      const url = await this.helpers.assetFileUrl({ url: 'http://some.url/file.txt' });
      expect(url).toBe(REWRITTEN_URL);
    });
  });

  itConvertsToEntryAndCallsMethod('entityTitle');
  itConvertsToEntryAndCallsMethod('entityDescription');
  itConvertsToEntryAndCallsMethod('entityFile', 'entryImage');
  itConvertsToEntryAndCallsMethod('entryImage');

  itConvertsToAssetAndCallsMethod('entityTitle');
  itConvertsToAssetAndCallsMethod('entityDescription');

  function itConvertsToEntryAndCallsMethod(methodName, spaceContextMethodName) {
    spaceContextMethodName = spaceContextMethodName || methodName;

    describe(`#${methodName}()`, function() {
      const contentType = {
        fields: [{ apiName: 'fieldA', id: 'fieldA' }, { apiName: 'fieldB', id: 'fieldBRealId' }]
      };
      const fields = {
        fieldA: { 'en-US': 'en' },
        fieldB: { 'en-US': 'valEN', de: 'valDE' },
        unknownField: {}
      };
      const entry = {
        sys: { type: 'Entry', contentType: { sys: { id: 'ctId' } } },
        fields
      };

      beforeEach(function() {
        this.spaceContext.publishedCTs.get.returns({ data: contentType });
      });

      it(`converts data to entry and calls spaceContext.${spaceContextMethodName}()`, async function() {
        const transformedFields = {
          fieldA: fields.fieldA,
          fieldBRealId: { 'en-US': 'valEN', 'de-internal': 'valDE' }
        };

        await this.helpers[methodName](entry);

        sinon.assert.calledOnce(this.spaceContext[spaceContextMethodName]);
        const [entity, locale] = this.spaceContext[spaceContextMethodName].firstCall.args;

        expect(entity.data.fields).toEqual(transformedFields);
        expect(entity.getType()).toBe('Entry');
        expect(entity.getContentTypeId()).toBe('ctId');
        expect(locale).toBe('en-US');
      });

      it(`passes internal locale to spaceContext`, async function() {
        const helpers = this.EntityHelpers.newForLocale('de');
        await helpers[methodName]({
          sys: { type: 'Entry' }
        });
        const locale = this.spaceContext[spaceContextMethodName].firstCall.args[1];
        expect(locale).toBe('de-internal');
      });
    });
  }

  function itConvertsToAssetAndCallsMethod(methodName, spaceContextMethodName) {
    spaceContextMethodName = spaceContextMethodName || methodName;

    it(`#${methodName}() converts data to asset and calls spaceContext.${spaceContextMethodName}()`, async function() {
      await this.helpers[methodName]({
        sys: { type: 'Asset' }
      });

      sinon.assert.calledOnce(this.spaceContext[spaceContextMethodName]);
      const [asset, locale] = this.spaceContext[spaceContextMethodName].firstCall.args;

      expect(asset.getType()).toBe('Asset');
      expect(locale).toBe('en-US');
    });
  }
});
