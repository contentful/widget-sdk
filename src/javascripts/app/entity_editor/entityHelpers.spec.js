import _ from 'lodash';
import {
  newForLocale,
  appendDuplicateIndexToEntryTitle,
  alignSlugWithEntryTitle,
} from './entityHelpers';
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

  describe('alignSlugWithEntryTitle', () => {
    it('should return back the given value if slugFieldData is falsy', () => {
      expect(alignSlugWithEntryTitle({ slugFieldData: null })).toBeNull();
      expect(alignSlugWithEntryTitle({ slugFieldData: undefined })).toBeUndefined();
      expect(alignSlugWithEntryTitle({ slugFieldData: false })).toBe(false);
    });

    it('should align non localized slug with the non localized entry title', () => {
      const entryTitleData = {
        'en-US': 'hi (1)',
      };

      const slugFieldData = {
        'en-US': 'hi',
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: {
          'en-US': 'hi',
        },
        isEntryTitleLocalized: false,
        slugFieldData,
        isRequired: false,
      });

      expect(slugData).toEqual({
        'en-US': 'hi-1',
      });
    });

    it('should align non localized slug with the correct locale of entry title', () => {
      const entryTitleData = {
        'en-US': 'hi (1)',
        de: 'hallo (1)',
      };

      const slugFieldData = {
        'en-US': 'hi',
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: {
          'en-US': 'hi',
          de: 'hallo',
        },
        isEntryTitleLocalized: true,
        slugFieldData,
        isRequired: false,
      });

      expect(slugData).toEqual({
        'en-US': 'hi-1',
      });
    });

    it('should align each locale of localized slug with the non localized entry title even if the localized slug was manually modified', () => {
      const entryTitleData = {
        'en-US': 'hi (1)',
      };

      const slugFieldData = {
        'en-US': 'hi',
        de: 'custom-value',
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: {
          'en-US': 'hi',
        },
        isEntryTitleLocalized: false,
        slugFieldData,
        isRequired: false,
      });

      expect(slugData).toEqual({
        'en-US': 'hi-1',
        de: 'hi-1',
      });
    });

    it('should align each locale of localized slug with the localized entry title', () => {
      const entryTitleData = {
        'en-US': 'hi (1)',
        de: 'hallo (1)',
      };

      const slugFieldData = {
        'en-US': 'hi',
        de: 'hallo',
        ru: 'privet',
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: {
          'en-US': 'hi',
          de: 'hallo',
        },
        isEntryTitleLocalized: true,
        slugFieldData,
        isRequired: false,
      });

      expect(slugData).toEqual({
        'en-US': 'hi-1',
        de: 'hallo-1',
        ru: 'privet',
      });
    });

    it('should align each locale of localized slug with the localized entry title even if localized slug was set manually', () => {
      const entryTitleData = {
        'en-US': 'hi (1)',
        de: 'hallo (1)',
      };

      const slugFieldData = {
        'en-US': 'hi',
        de: 'custom-value',
        ru: 'privet',
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: {
          'en-US': 'hi',
          de: 'hallo',
        },
        isEntryTitleLocalized: true,
        slugFieldData,
        isRequired: false,
      });

      expect(slugData).toEqual({
        'en-US': 'hi-1',
        de: 'hallo-1',
        ru: 'privet',
      });
    });

    it('should not set untitled slug if it is undefined and required: false', () => {
      const entryTitleData = {
        'en-US': null,
        de: 'hallo (1)',
      };

      const slugFieldData = {
        'en-US': null,
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: {
          'en-US': null,
          de: 'hallo',
        },
        isEntryTitleLocalized: true,
        slugFieldData,
        isRequired: false,
      });

      expect(slugData['en-US']).toBeNull();
    });

    it('should set untitled slug if is undefined and required: true', () => {
      const entryTitleData = {
        'en-US': null,
        de: 'hallo (1)',
      };

      const slugFieldData = {
        'en-US': null,
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: {
          'en-US': null,
          de: 'hallo',
        },
        isEntryTitleLocalized: true,
        slugFieldData,
        isRequired: true,
      });

      expect(slugData['en-US']).not.toBeNull();
      expect(slugData['en-US'].startsWith('untitled-entry')).toBe(true);
    });

    it('should not set untitled slug for localized slug field if localized value is undefined and required: false', () => {
      const entryTitleData = {
        'en-US': null,
        de: 'hallo (1)',
      };

      const slugFieldData = {
        'en-US': null,
        de: 'hallo',
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: {
          'en-US': null,
          de: 'hallo',
        },
        isEntryTitleLocalized: true,
        slugFieldData,
        isRequired: false,
      });

      expect(slugData['en-US']).toBeNull();
      expect(slugData.de).toBe('hallo-1');
    });

    it('should set untitled slug for localized slug field if localized value is undefined and required: true', () => {
      const entryTitleData = {
        'en-US': null,
        de: 'hallo (1)',
      };

      const slugFieldData = {
        'en-US': null,
        de: 'hallo',
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: {
          'en-US': null,
          de: 'hallo',
        },
        isEntryTitleLocalized: true,
        slugFieldData,
        isRequired: true,
      });

      expect(slugData['en-US']).not.toBeNull();
      expect(slugData['en-US'].startsWith('untitled-entry')).toBe(true);
      expect(slugData.de).toBe('hallo-1');
    });

    it('should return the same slug if entryTitleData is undefined and slug is not required', () => {
      const entryTitleData = null;

      const slugFieldData = {
        'en-US': null,
        de: 'hallo',
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: null,
        isEntryTitleLocalized: false,
        slugFieldData,
        isRequired: false,
      });

      expect(slugData).toEqual({
        'en-US': null,
        de: 'hallo',
      });
    });

    it('should return the same slug and initialized undefiled localized values if entryTitleData is undefined and slug is required', () => {
      const entryTitleData = null;

      const slugFieldData = {
        'en-US': null,
        de: 'hallo',
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: null,
        isEntryTitleLocalized: false,
        slugFieldData,
        isRequired: true,
      });

      expect(slugData['en-US']).not.toBeNull();
      expect(slugData['en-US'].startsWith('untitled-entry')).toBe(true);
      expect(slugData.de).toBe('hallo');
    });

    it('should allow to pass the date to be used in the untitled slug', () => {
      const entryTitleData = {
        'en-US': 'hi (1)',
        de: null,
      };
      const createdAt = new Date('2020-02-22');

      const slugFieldData = {
        de: null,
      };

      const slugData = alignSlugWithEntryTitle({
        entryTitleData,
        unindexedTitleData: {
          'en-US': 'hi',
          de: null,
        },
        isEntryTitleLocalized: true,
        slugFieldData,
        isRequired: true,
        createdAt,
      });

      expect(slugData['en-US']).toBeUndefined();
      expect(slugData.de.startsWith('untitled-entry-2020-02-22')).toBe(true);
    });
  });
});
