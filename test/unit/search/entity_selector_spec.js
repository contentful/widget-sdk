import _ from 'lodash';

describe('entitySelector', () => {
  beforeEach(function() {
    module('contentful/test');

    this.$q = this.$inject('$q');
    this.entitySelector = this.$inject('entitySelector');
    this.openDialogStub = sinon.stub().returns({ promise: this.$q.resolve() });
    this.$inject('modalDialog').open = this.openDialogStub;

    this.open = (field, links) => {
      const promise = this.entitySelector.openFromField(field, links);
      this.$apply();
      return promise;
    };
    this.getScope = () => this.openDialogStub.lastCall.args[0].scopeData;
    this.getConfig = () => this.getScope().entitySelector.config;
    this.getLabels = () => this.getScope().entitySelector.labels;
  });

  it('throws error if invalid entity type is provided', function() {
    expect(() => this.open({ linkType: 'Foobar' })).toThrowError(
      "Unsupported entity type: 'Foobar'."
    );
  });

  describe('config preparation', () => {
    it('sets type of linked entity', async function() {
      await this.open({ linkType: 'Entry' });
      expect(this.getConfig().entityType).toBe('Entry');
      await this.open({ linkType: 'Asset' });
      expect(this.getConfig().entityType).toBe('Asset');
    });

    describe('setting min/max number of linked entities', () => {
      it('do not limit by default', async function() {
        await this.open({ linkType: 'Entry' });
        expect(this.getConfig().min).toBe(1);
        expect(this.getConfig().max).toBe(Infinity);
      });

      it('respects field items size constraint', async function() {
        await this.open({ linkType: 'Entry', itemValidations: [size(6, 12)] });
        expect(this.getConfig().min).toBe(6);
        expect(this.getConfig().max).toBe(12);
      });

      it('substracts current link count from limits', async function() {
        await this.open({ linkType: 'Entry', itemValidations: [size(3, 6)] }, 2);
        expect(this.getConfig().min).toBe(1);
        expect(this.getConfig().max).toBe(4);
      });

      it('uses 1 as minimal lower bound', async function() {
        await this.open({ linkType: 'Entry', itemValidations: [size(2, 6)] }, 2);
        expect(this.getConfig().min).toBe(1);
        expect(this.getConfig().max).toBe(4);
      });
    });

    describe('differentiating between single link and array of links', () => {
      it('checks for "Array" field type', async function() {
        await this.open({ linkType: 'Entry', type: 'Array' });
        expect(this.getConfig().multiple).toBe(true);
        await this.open({ linkType: 'Entry', type: 'Link' });
        expect(this.getConfig().multiple).toBe(false);
      });

      it('treats as a single link when only one entity can be selected', async function() {
        await this.open({ linkType: 'Entry', type: 'Array', itemValidations: [size(2, 2)] });
        expect(this.getConfig().multiple).toBe(false);
      });
    });

    describe('processing validations', () => {
      it('defaults to an appropriate (empty) data structure', async function() {
        await this.open({ linkType: 'Entry' });
        const config = this.getConfig();
        expect(config.linkedContentTypeIds).toEqual([]);
        expect(config.linkedMimetypeGroups).toEqual([]);
      });

      it('extracts allowed linked entry content type IDs', async function() {
        const validation = { linkContentType: ['ctid1', 'ctid2'] };
        await this.open({ linkType: 'Entry', itemValidations: [validation] });
        expect(this.getConfig().linkedContentTypeIds).toEqual(['ctid1', 'ctid2']);
      });

      it('extracts allowed asset MIMEtype groups', async function() {
        const validation = { linkMimetypeGroup: ['group1', 'group2'] };
        await this.open({ linkType: 'Asset', itemValidations: [validation] });
        expect(this.getConfig().linkedMimetypeGroups).toEqual(['group1', 'group2']);
      });

      // @todo disabled: see comments in "entitySelector#prepareQueryExtension"
      xit('extracts allowed asset size', async function() {
        const validation = size(100, 200, 'assetFileSize');
        await this.open({ linkType: 'Asset', itemValidations: [validation] });
        expect(this.getConfig().linkedFileSize).toEqual({ min: 100, max: 200 });
      });

      // @todo disabled: see comments in "entitySelector#prepareQueryExtension"
      xit('extracts allowed image dimensions', async function() {
        const dimensions = _.extend(size(100, 200, 'width'), size(300, 400, 'height'));
        const validation = { assetImageDimensions: dimensions };
        await this.open({ linkType: 'Asset', itemValidations: [validation] });
        expect(this.getConfig().linkedImageDimensions).toEqual({
          width: { min: 100, max: 200 },
          height: { min: 300, max: 400 }
        });
      });
    });
  });

  it('sets lables', async function() {
    await this.open({ linkType: 'Entry' });
    expect(this.getLabels().title).toBe('Insert existing entry');
    await this.open({ linkType: 'Entry', type: 'Array' });
    expect(this.getLabels().title).toBe('Insert existing entries');
    await this.open({ linkType: 'Asset' });
    expect(this.getLabels().title).toBe('Insert existing asset');
    await this.open({ linkType: 'Asset', type: 'Array' });
    expect(this.getLabels().title).toBe('Insert existing assets');
  });

  describe('opening from an extension', () => {
    beforeEach(function() {
      const mockedLocaleStore = (this.$inject('TheLocaleStore').getDefaultLocale = _.constant({
        code: 'de-DE'
      }));
      const { registerFactory } = this.$inject('NgRegistry.es6');
      registerFactory('TheLocaleStore', () => mockedLocaleStore);

      this.openFromExt = opts => {
        const promise = this.entitySelector.openFromExtension(opts);
        this.$apply();
        return promise;
      };

      this.resolveWith = value => {
        this.openDialogStub.returns({ promise: this.$q.resolve(value) });
      };

      this.rejectWith = err => {
        this.openDialogStub.returns({ promise: this.$q.reject(err) });
      };

      this.resolveWith([{ test: true }]);
    });

    it('selecting a single entity', async function() {
      const entry = await this.openFromExt({ entityType: 'Entry', multiple: false });
      expect(this.getConfig().multiple).toBe(false);
      expect(entry).toEqual({ test: true });
    });

    it('selecting many entities', async function() {
      const selected = [{ multiple: 1 }, { multiple: 2 }];
      this.resolveWith(selected);
      const entries = await this.openFromExt({ entityType: 'Entry', multiple: true });
      expect(this.getConfig().multiple).toBe(true);
      expect(entries).toEqual(selected);
    });

    it('resolves with null if selection was skipped', async function() {
      this.rejectWith(undefined);
      expect(await this.openFromExt({ entityType: 'Entry' })).toBe(null);
    });

    it('rejects with an original error thrown in the process', async function() {
      this.rejectWith(new Error('selector error'));

      const err = await this.openFromExt({ entityType: 'Entry' }).catch(_.identity);
      expect(err.message).toBe('selector error');
    });

    describe('converting options to validations', () => {
      it('"contentTypes" option converted to validation', async function() {
        const spaceContext = this.$inject('mocks/spaceContext').init();
        spaceContext.publishedCTs.fetch.resolves({});

        const ids = ['blogpost', 'cat'];
        await this.openFromExt({ entityType: 'Entry', contentTypes: ids });
        expect(this.getConfig().linkedContentTypeIds).toEqual(ids);
      });

      it('"mix" and "max" options converted to validation', async function() {
        await this.openFromExt({ entityType: 'Entry', multiple: true, min: 2, max: 4 });
        const config = this.getConfig();
        expect(config.min).toBe(2);
        expect(config.max).toBe(4);
      });
    });

    describe('locale option', () => {
      it('uses provided locale', async function() {
        await this.openFromExt({ entityType: 'Entry', locale: 'co-DE' });
        expect(this.getConfig().locale).toBe('co-DE');
      });

      it('uses default space locale if not provided', async function() {
        await this.openFromExt({ entityType: 'Entry' });
        expect(this.getConfig().locale).toBe('de-DE');
      });
    });
  });
});

function size(min, max, key) {
  const t = {};
  t[key || 'size'] = { min: min, max: max };
  return t;
}
