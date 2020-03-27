import * as spaceContextMocked from 'ng/spaceContext';
import _ from 'lodash';
import {
  entryTitle,
  entityTitle,
  assetTitle,
  getFieldValue,
  displayFieldForType,
  entityDescription,
  entryImage,
} from './EntityFieldValueSpaceContext';

jest.mock('services/localeStore', () => ({
  getDefaultLocale: () => ({
    code: 'en-US',
  }),
}));

function makeCtMock(id, opts = {}) {
  return {
    data: {
      sys: { id },
      displayField: opts.displayField,
      fields: opts.fields || [],
    },
    getId: _.constant(id),
    isDeleted: _.constant(opts.isDeleted === true),
    getName: _.constant(id),
  };
}

describe('EntityFieldValueSpaceContext', () => {
  beforeEach(() => {
    spaceContextMocked.publishedCTs.get.mockReset();
  });

  describe('entryTitle', () => {
    const entry = {
      getContentTypeId: _.constant('CTID'),
      getType: _.constant('Entry'),
      data: {
        fields: {
          title: {
            'en-US': 'the title',
            zh: 'chinese title',
          },
        },
      },
    };

    it('fetched successfully', function () {
      spaceContextMocked.publishedCTs.get.mockReturnValue(
        makeCtMock('CTID', {
          displayField: 'title',
          fields: [{ id: 'title', type: 'Symbol' }],
        })
      );
      expect(entryTitle(entry)).toBe('the title');
      expect(entryTitle(entry, 'en-US', true)).toBe('the title');
      expect(entityTitle(entry)).toBe('the title');
    });

    it('returns default locale if not localized', function () {
      spaceContextMocked.publishedCTs.get.mockReturnValue(
        makeCtMock('CTID', {
          displayField: 'title',
          fields: [{ id: 'title', type: 'Symbol', localized: false }],
        })
      );
      expect(entityTitle(entry, 'zh')).toBe('the title');
    });

    it('returns localized title', function () {
      spaceContextMocked.publishedCTs.get.mockReturnValue(
        makeCtMock('CTID', {
          displayField: 'title',
          fields: [{ id: 'title', type: 'Symbol', localized: true }],
        })
      );

      expect(entityTitle(entry, 'zh')).toBe('chinese title');
    });

    it('gets no title, falls back to default', function () {
      spaceContextMocked.publishedCTs.get.mockReturnValue({
        data: {},
      });

      expect(entryTitle(entry)).toBe('Untitled');
      expect(entryTitle(entry, 'en-US', true)).toBeNull();
      expect(entityTitle(entry)).toBeNull();
    });

    it('handles an exception, falls back to default', function () {
      spaceContextMocked.publishedCTs.get.mockReturnValue({});
      expect(entryTitle(entry)).toBe('Untitled');
      expect(entityTitle(entry)).toBeNull();
    });

    it('fetched successfully but title is empty', function () {
      entry.data.fields.title = '   ';
      expect(entryTitle(entry)).toBe('Untitled');
      expect(entryTitle(entry, undefined, true)).toBeNull();
      expect(entityTitle(entry)).toBeNull();
    });

    it("fetched successfully but title doesn't exist", function () {
      const entryCopy = { ...entry };
      delete entryCopy.data.fields.title;
      expect(entryTitle(entryCopy)).toEqual('Untitled');
      expect(entryTitle(entryCopy, undefined, true)).toBeNull();
      expect(entityTitle(entryCopy)).toBeNull();
    });
  });

  describe('assetTitle', () => {
    let asset;

    beforeEach(() => {
      asset = {
        getType: _.constant('Asset'),
        data: {
          fields: {
            title: {
              'en-US': 'the title',
            },
          },
        },
      };
    });

    it('fetched successfully', function () {
      expect(assetTitle(asset)).toBe('the title');
      expect(assetTitle(asset, 'en-US', true)).toBe('the title');
      expect(entityTitle(asset)).toBe('the title');
    });

    it('gets no title, falls back to default', function () {
      asset.data = { fields: {} };
      expect(assetTitle(asset)).toBe('Untitled');
      expect(assetTitle(asset, 'en-US', true)).toBeNull();
      expect(entityTitle(asset)).toBeNull();
    });

    it('handles an exception, falls back to default', function () {
      asset.data = {};
      expect(assetTitle(asset)).toBe('Untitled');
      expect(entityTitle(asset)).toBeNull();
    });

    it('fetched successfully but title is empty', function () {
      asset.data.fields.title = '   ';
      expect(assetTitle(asset)).toBe('Untitled');
      expect(entityTitle(asset)).toBeNull();
    });

    it("fetched successfully but title doesn't exist", function () {
      delete asset.data.fields.title;
      expect(assetTitle(asset)).toBe('Untitled');
      expect(entityTitle(asset)).toBeNull();
    });

    it('gets a localized field', function () {
      expect(getFieldValue(asset, 'title')).toBe('the title');
    });
  });

  describe('#displayedFieldForType()', () => {
    it('returns the field', function () {
      const field = { id: 'name' };
      spaceContextMocked.publishedCTs.get.mockReturnValue({
        data: {
          displayField: 'name',
          fields: [field],
        },
      });
      expect(displayFieldForType('type')).toBe(field);
    });

    it('returns nothing', function () {
      const field = { id: 'name' };
      spaceContextMocked.publishedCTs.get.mockReturnValue({
        data: {
          displayField: 'othername',
          fields: [field],
        },
      });
      expect(displayFieldForType('type')).toBeUndefined();
    });
  });

  describe('finding entity fields', () => {
    const ASSET_LINK_XX = {
      sys: { id: 'ASSET_1' },
    };
    const ASSET_LINK_IT = {
      sys: { id: 'ASSET_2' },
    };

    let fields, ct, entry;

    beforeEach(() => {
      fields = [
        { type: 'Number', id: 'NUMBER' },
        { type: 'Symbol', id: 'SYMBOL' },
        { type: 'Text', id: 'TEXT' },
        { type: 'Link', linkType: 'Entry', id: 'ENTRY' },
        { type: 'Link', linkType: 'Asset', id: 'ASSET' },
      ];
      ct = {
        data: {
          fields,
        },
      };
      entry = {
        getContentTypeId: _.constant('CTID'),
        data: {
          fields: {
            NUMBER: { xx: 'NUMBER' },
            SYMBOL: { xx: 'SYMBOL VAL', de: 'SYMBOL VAL DE' },
            TEXT: { en: 'VAL EN', xx: 'VAL', de: 'VAL DE' },
            ASSET: { xx: ASSET_LINK_XX, it: ASSET_LINK_IT },
          },
        },
      };
      spaceContextMocked.publishedCTs.get.mockImplementation((contentTypeId) => {
        if (contentTypeId === 'CTID') {
          return ct;
        }
      });
    });

    //   beforeEach(async function() {

    //     const CTRepo = await this.system.import('data/ContentTypeRepo/Published');
    //     this.spaceContext.publishedCTs = stubAll(CTRepo.create());
    //     this.spaceContext.publishedCTs.get.withArgs('CTID').returns(this.ct);
    //   });
    describe('#entityDescription()', () => {
      it('returns value of first text or symbol field, falls back to default locale', function () {
        const desc = entityDescription(entry);
        expect(desc).toBe('SYMBOL VAL');
      });
      it('returns value of first text or symbol field for given locale', function () {
        const desc = entityDescription(entry, 'de');
        expect(desc).toBe('SYMBOL VAL DE');
      });

      describe('skips potential slug fields', function () {
        beforeEach(function () {
          _.remove(fields, (field) => ['Text', 'Symbol'].includes(field.type));
          ct.data.fields.push({ type: 'Symbol', id: 'SLUG', name: 'slug' });
          entry.data.fields.SLUG = { xx: 'SLUG 1' };
          ct.data.fields.push({ type: 'Text', id: 'SLUG_2', name: 'Another slug-field' });
          entry.data.fields.SLUG_2 = { xx: 'SLUG 2' };
        });
        it('returns undefined if there is only slug text fields', function () {
          const desc = entityDescription(entry);
          expect(desc).toBeUndefined();
        });
        it('returns a field containing name containing "slug" without word boundary', function () {
          ct.data.fields.push({
            type: 'Symbol',
            id: 'SLUG_3',
            name: 'sluggish',
            localized: true,
          });
          entry.data.fields.SLUG_3 = { xx: 'SLUGGISH', de: 'SLUGGISH DE' };
          const desc = entityDescription(entry);
          expect(desc).toBe('SLUGGISH');
          const descDe = entityDescription(entry, 'de');
          expect(descDe).toBe('SLUGGISH DE');
        });
      });

      describe('skips display field', () => {
        beforeEach(function () {
          _.remove(fields, (field) => field.id === 'TEXT');
          delete entry.data.fields.TEXT;
          ct.data.displayField = 'SYMBOL';
        });
        it('returns undefined if there is no other field', function () {
          const desc = entityDescription(entry);
          expect(desc).toBeUndefined();
        });
        it('returns value of the next text field', function () {
          ct.data.fields.push({ type: 'Text', id: 'TEXT_2' });
          entry.data.fields.TEXT_2 = { xx: 'VAL 2', de: 'VAL 2 DE' };
          const desc = entityDescription(entry);
          expect(desc).toBe('VAL 2');
          const descDe = entityDescription(entry, 'de');
          expect(descDe).toBe('VAL 2 DE');
        });
      });
      it('returns undefined if content type is not available', function () {
        spaceContextMocked.publishedCTs.get.mockReturnValue(null);

        const desc = entityDescription({
          getContentTypeId: _.constant(),
        });
        expect(desc).toBeUndefined();
      });
    });
    describe('#entryImage', () => {
      let file;

      beforeEach(function () {
        file = { details: { image: {} } };
        const asset = {};
        _.set(asset, 'data.fields.file.xx', file);
        spaceContextMocked.space.getAsset = jest.fn().mockImplementation((id) => {
          if (id === ASSET_LINK_XX.sys.id) {
            return Promise.resolve(asset);
          } else if (id === ASSET_LINK_IT.sys.id) {
            return Promise.reject();
          }
        });
      });
      it('resolves a promise with an image file', function (done) {
        entryImage(entry).then((res) => {
          expect(res).toBe(file);
          done();
        });
      });
      it('resolves a promise with an image file for given locale', function (done) {
        entryImage(entry, 'xx').then((res) => {
          expect(res).toBe(file);
          done();
        });
      });
      it('resolves a promise with default locale`s image if unknown locale', function (done) {
        entryImage(entry, 'foo').then((res) => {
          expect(res).toBe(file);
          done();
        });
      });
      it('resolves a promise with null if no linked asset field in CT', function (done) {
        _.remove(fields, (field) => field.type === 'Link');
        entryImage(entry).then((res) => {
          expect(res).toBeNull();
          done();
        });
      });
      it('resolves a promise with null if linked asset is not an image', function (done) {
        delete file.details.image;
        entryImage(entry).then((res) => {
          expect(res).toBeNull();
          done();
        });
      });
      it('resolves a promise with null if dead link for given locale', function (done) {
        // TODO: We might want to refine this edge case's behavior and try to load
        //       another locale's image then.
        entryImage(entry, 'it').then((res) => {
          expect(res).toBeNull();
          done();
        });
      });
    });
  });
});
