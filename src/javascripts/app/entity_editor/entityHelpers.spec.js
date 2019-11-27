import _ from 'lodash';
import { newForLocale } from './entityHelpers';
import * as spaceContextMocked from 'ng/spaceContext';

const mockRewrittenUrl = 'http://rewritten.url/file.txt';

const mockInternalLocale = {
  'en-US': 'en-US',
  de: 'de-internal'
};

jest.mock('services/AssetUrlService', () => {
  return {
    transformHostname: () => mockRewrittenUrl
  };
});

jest.mock('services/localeStore', () => {
  return {
    toInternalCode: code => mockInternalLocale[code]
  };
});

describe('EntityHelpers', () => {
  const throwingFn = () => {
    throw new Error('Should not end up here!');
  };

  let helpers;

  beforeEach(async function() {
    helpers = newForLocale('en-US');
    spaceContextMocked.entityTitle.mockClear();
    spaceContextMocked.entityDescription.mockClear();
    spaceContextMocked.entryImage.mockClear();
    spaceContextMocked.publishedCTs.get.mockClear();
  });

  describe('#assetFileUrl', () => {
    it('rejects if invalid file is provided', async function() {
      await helpers.assetFileUrl({}).then(throwingFn, _.noop);
    });

    it('resolves with URL', async function() {
      const url = await helpers.assetFileUrl({ url: 'http://some.url/file.txt' });
      expect(url).toBe(mockRewrittenUrl);
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
        spaceContextMocked.publishedCTs.get.mockReturnValue({ data: contentType });
      });

      it(`converts data to entry and calls spaceContext.${spaceContextMethodName}()`, async function() {
        const transformedFields = {
          fieldA: fields.fieldA,
          fieldBRealId: { 'en-US': 'valEN', 'de-internal': 'valDE' }
        };

        await helpers[methodName](entry);

        expect(spaceContextMocked[spaceContextMethodName]).toHaveBeenCalledTimes(1);

        const [entity, locale] = spaceContextMocked[spaceContextMethodName].mock.calls[0];

        expect(entity.data.fields).toEqual(transformedFields);
        expect(entity.getType()).toBe('Entry');
        expect(entity.getContentTypeId()).toBe('ctId');
        expect(locale).toBe('en-US');
      });

      it(`passes internal locale to spaceContext`, async function() {
        const helpers = newForLocale('de');
        await helpers[methodName]({
          sys: { type: 'Entry' }
        });
        const locale = spaceContextMocked[spaceContextMethodName].mock.calls[0][1];
        expect(locale).toBe('de-internal');
      });
    });
  }

  function itConvertsToAssetAndCallsMethod(methodName, spaceContextMethodName) {
    spaceContextMethodName = spaceContextMethodName || methodName;

    it(`#${methodName}() converts data to asset and calls spaceContext.${spaceContextMethodName}()`, async function() {
      await helpers[methodName]({
        sys: { type: 'Asset' }
      });

      expect(spaceContextMocked[spaceContextMethodName]).toHaveBeenCalledTimes(1);

      const [asset, locale] = spaceContextMocked[spaceContextMethodName].mock.calls[0];

      expect(asset.getType()).toBe('Asset');
      expect(locale).toBe('en-US');
    });
  }
});
