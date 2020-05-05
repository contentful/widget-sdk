import _ from 'lodash';
import { newForLocale, appendDuplicateIndexToEntryTitle } from './entityHelpers';
import * as spaceContextMocked from 'ng/spaceContext';
import * as EntityFieldValueSpaceContextMocked from 'classes/EntityFieldValueSpaceContext';

const mockRewrittenUrl = 'http://rewritten.url/file.txt';

const mockInternalLocale = {
  'en-US': 'en-US',
  de: 'de-internal',
};

jest.mock('classes/EntityFieldValueSpaceContext', () => ({
  entityTitle: jest.fn(),
  entityDescription: jest.fn(),
  entryImage: jest.fn(),
}));

jest.mock('services/AssetUrlService', () => {
  return {
    transformHostname: () => mockRewrittenUrl,
  };
});

jest.mock('services/localeStore', () => {
  return {
    toInternalCode: (code) => mockInternalLocale[code],
  };
});

describe('EntityHelpers', () => {
  const throwingFn = () => {
    throw new Error('Should not end up here!');
  };

  let helpers;

  beforeEach(async function () {
    helpers = newForLocale('en-US');
    EntityFieldValueSpaceContextMocked.entityTitle.mockClear();
    EntityFieldValueSpaceContextMocked.entityDescription.mockClear();
    EntityFieldValueSpaceContextMocked.entryImage.mockClear();
    spaceContextMocked.publishedCTs.get.mockClear();
  });

  describe('#assetFileUrl', () => {
    it('rejects if invalid file is provided', async function () {
      await helpers.assetFileUrl({}).then(throwingFn, _.noop);
    });

    it('resolves with URL', async function () {
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

    describe(`#${methodName}()`, function () {
      const contentType = {
        fields: [
          { apiName: 'fieldA', id: 'fieldA' },
          { apiName: 'fieldB', id: 'fieldBRealId' },
        ],
      };
      const fields = {
        fieldA: { 'en-US': 'en' },
        fieldB: { 'en-US': 'valEN', de: 'valDE' },
        unknownField: {},
      };
      const entry = {
        sys: { type: 'Entry', contentType: { sys: { id: 'ctId' } } },
        fields,
      };

      beforeEach(function () {
        spaceContextMocked.publishedCTs.get.mockReturnValue({ data: contentType });
      });

      it(`converts data to entry and calls EntityFieldValueSpaceContext.${spaceContextMethodName}()`, async function () {
        const transformedFields = {
          fieldA: fields.fieldA,
          fieldBRealId: { 'en-US': 'valEN', 'de-internal': 'valDE' },
        };

        await helpers[methodName](entry);

        expect(EntityFieldValueSpaceContextMocked[spaceContextMethodName]).toHaveBeenCalledTimes(1);

        const [entity, locale] = EntityFieldValueSpaceContextMocked[
          spaceContextMethodName
        ].mock.calls[0];

        expect(entity.data.fields).toEqual(transformedFields);
        expect(entity.getType()).toBe('Entry');
        expect(entity.getContentTypeId()).toBe('ctId');
        expect(locale).toBe('en-US');
      });

      it(`passes internal locale to EntityFieldValueSpaceContext`, async function () {
        const helpers = newForLocale('de');
        await helpers[methodName]({
          sys: { type: 'Entry' },
        });
        const locale = EntityFieldValueSpaceContextMocked[spaceContextMethodName].mock.calls[0][1];
        expect(locale).toBe('de-internal');
      });
    });
  }

  function itConvertsToAssetAndCallsMethod(methodName, spaceContextMethodName) {
    spaceContextMethodName = spaceContextMethodName || methodName;

    it(`#${methodName}() converts data to asset and calls EntityFieldValueSpaceContext.${spaceContextMethodName}()`, async function () {
      await helpers[methodName]({
        sys: { type: 'Asset' },
      });

      expect(EntityFieldValueSpaceContextMocked[spaceContextMethodName]).toHaveBeenCalledTimes(1);

      const [asset, locale] = EntityFieldValueSpaceContextMocked[
        spaceContextMethodName
      ].mock.calls[0];

      expect(asset.getType()).toBe('Asset');
      expect(locale).toBe('en-US');
    });
  }

  describe('appendDuplicateIndexToEntryTitle', function () {
    it('should add (1) to the end of the entryTitle', () => {
      const entryTitleId = 123;
      const fields = {
        [entryTitleId]: {
          'en-US': 'Hey!',
          de: 'Ahoi!',
        },
      };
      expect(appendDuplicateIndexToEntryTitle(fields, entryTitleId)).toEqual({
        [entryTitleId]: {
          'en-US': 'Hey! (1)',
          de: 'Ahoi! (1)',
        },
      });
    });

    it('should increment the given index if present', () => {
      const entryTitleId = 123;
      const fields = {
        [entryTitleId]: {
          'en-US': 'Hey! (1)',
          de: 'Ahoi! (1)',
        },
      };
      expect(appendDuplicateIndexToEntryTitle(fields, entryTitleId)).toEqual({
        [entryTitleId]: {
          'en-US': 'Hey! (2)',
          de: 'Ahoi! (2)',
        },
      });
    });

    it('should not throw if entry title is not defined', () => {
      const entryTitleId = 123;
      const fields = {
        [entryTitleId]: null,
      };
      expect(() => {
        expect(appendDuplicateIndexToEntryTitle(fields, entryTitleId)).toEqual({
          [entryTitleId]: null,
        });
      }).not.toThrow();
    });

    it('should not break if one of the locale values is undefined / null', () => {
      const entryTitleId = 123;
      const fields = {
        [entryTitleId]: {
          'en-US': 'Hey! (1)',
          de: null,
        },
      };
      expect(() => {
        expect(appendDuplicateIndexToEntryTitle(fields, entryTitleId)).toEqual({
          [entryTitleId]: {
            'en-US': 'Hey! (2)',
            de: null,
          },
        });
      }).not.toThrow();
    });

    it('should not increment a zero index', () => {
      const entryTitleId = 123;
      const fields = {
        [entryTitleId]: {
          'en-US': 'Hey! (0)',
          de: 'Ahoi! (0)',
        },
      };
      expect(appendDuplicateIndexToEntryTitle(fields, entryTitleId)).toEqual({
        [entryTitleId]: {
          'en-US': 'Hey! (0) (1)',
          de: 'Ahoi! (0) (1)',
        },
      });
    });

    it('should increment a multi-digit index', () => {
      const entryTitleId = 123;
      const fields = {
        [entryTitleId]: {
          'en-US': 'Hey! (10)',
          de: 'Ahoi! (10)',
        },
      };
      expect(appendDuplicateIndexToEntryTitle(fields, entryTitleId)).toEqual({
        [entryTitleId]: {
          'en-US': 'Hey! (11)',
          de: 'Ahoi! (11)',
        },
      });
    });
  });
});
