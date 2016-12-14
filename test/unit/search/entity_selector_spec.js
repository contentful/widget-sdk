'use strict';

describe('entitySelector', function () {
  beforeEach(function () {
    module('contentful/test');

    this.$q = this.$inject('$q');
    this.entitySelector = this.$inject('entitySelector');
    this.openDialogStub = sinon.stub().returns({promise: this.$q.resolve()});
    this.$inject('modalDialog').open = this.openDialogStub;

    this.open = function (field, links) {
      const promise = this.entitySelector.open(field, links);
      this.$apply();
      return promise;
    };

    this.getScope = function () {
      return this.openDialogStub.lastCall.args[0].scopeData;
    };

    this.getConfig = function () {
      return this.getScope().config;
    };
  });

  function size (min, max, key) {
    const t = {};
    t[key || 'size'] = {min: min, max: max};
    return t;
  }

  pit('rejects if no valid field is provided', function () {
    return this.open({}).then(_.noop, function (err) {
      expect(err.message).toMatch(/valid/);
    });
  });

  describe('config preparation', function () {
    it('sets type of linked entity', function () {
      this.open({linkType: 'Entry'});
      expect(this.getConfig().linksEntry).toBe(true);
      expect(this.getConfig().linksAsset).toBe(false);
      this.open({linkType: 'Asset'});
      expect(this.getConfig().linksEntry).toBe(false);
      expect(this.getConfig().linksAsset).toBe(true);
    });

    describe('setting min/max number of linked entities', function () {
      it('do not limit by default', function () {
        this.open({linkType: 'Entry'});
        expect(this.getConfig().min).toBe(1);
        expect(this.getConfig().max).toBe(Infinity);
      });

      it('respects field items size constraint', function () {
        this.open({linkType: 'Entry', itemValidations: [size(6, 12)]});
        expect(this.getConfig().min).toBe(6);
        expect(this.getConfig().max).toBe(12);
      });

      it('substracts current link count from limits', function () {
        this.open({linkType: 'Entry', itemValidations: [size(3, 6)]}, 2);
        expect(this.getConfig().min).toBe(1);
        expect(this.getConfig().max).toBe(4);
      });

      it('uses 1 as minimal lower bound', function () {
        this.open({linkType: 'Entry', itemValidations: [size(2, 6)]}, 2);
        expect(this.getConfig().min).toBe(1);
        expect(this.getConfig().max).toBe(4);
      });
    });

    describe('differentiating between single link and array of links', function () {
      it('checks for "Array" field type', function () {
        this.open({linkType: 'Entry', type: 'Array'});
        expect(this.getConfig().multiple).toBe(true);
        this.open({linkType: 'Entry', type: 'Link'});
        expect(this.getConfig().multiple).toBe(false);
      });

      it('treats as a single link when only one entity can be selected', function () {
        this.open({linkType: 'Entry', type: 'Array', itemValidations: [size(2, 2)]});
        expect(this.getConfig().multiple).toBe(false);
      });
    });

    describe('processing validations', function () {
      it('defaults to an appropriate (empty) data structure', function () {
        this.open({linkType: 'Entry'});
        const config = this.getConfig();
        expect(config.linkedContentTypeIds).toEqual([]);
        expect(config.linkedMimetypeGroups).toEqual([]);
      });

      it('extracts allowed linked entry content type IDs', function () {
        const validation = {linkContentType: ['ctid1', 'ctid2']};
        this.open({linkType: 'Entry', itemValidations: [validation]});
        expect(this.getConfig().linkedContentTypeIds).toEqual(['ctid1', 'ctid2']);
      });

      it('extracts allowed asset MIMEtype groups', function () {
        const validation = {linkMimetypeGroup: ['group1', 'group2']};
        this.open({linkType: 'Asset', itemValidations: [validation]});
        expect(this.getConfig().linkedMimetypeGroups).toEqual(['group1', 'group2']);
      });


      // @todo disabled: see comments in "entitySelector#prepareQueryExtension"
      xit('extracts allowed asset size', function () {
        const validation = size(100, 200, 'assetFileSize');
        this.open({linkType: 'Asset', itemValidations: [validation]});
        expect(this.getConfig().linkedFileSize).toEqual({min: 100, max: 200});
      });

      // @todo disabled: see comments in "entitySelector#prepareQueryExtension"
      xit('extracts allowed image dimensions', function () {
        const dimensions = _.extend(size(100, 200, 'width'), size(300, 400, 'height'));
        const validation = {assetImageDimensions: dimensions};
        this.open({linkType: 'Asset', itemValidations: [validation]});
        expect(this.getConfig().linkedImageDimensions).toEqual({
          width: {min: 100, max: 200},
          height: {min: 300, max: 400}
        });
      });
    });
  });

  describe('query extension preparation', function () {
    beforeEach(function () {
      this.qe = function (type, vs) {
        this.open({linkType: type, itemValidations: _.isArray(vs) ? vs : [vs]});
        return this.getConfig().queryExtension;
      };
    });

    it('extends query with allowed content types', function () {
      const ext = this.qe('Entry', {linkContentType: ['ctid1', 'ctid2']});
      expect(ext['sys.contentType.sys.id[in]']).toBe('ctid1,ctid2');
    });

    it('extends query with allowed asset MIMEs', function () {
      this.$inject('mimetype').getTypesForGroup = sinon.stub().returns('mimez');
      const ext = this.qe('Asset', {linkMimetypeGroup: ['g1', 'g2']});
      expect(ext['fields.file.contentType[in]']).toBe('mimez,mimez');
    });

    // see "prepareQueryExtension" function in "entity_selector.js"
    xit('extends query with asset size constraints', function () {
      const dimensions = _.extend(size(100, 200, 'width'), size(300, 400, 'height'));
      const validations = [{assetImageDimensions: dimensions}, size(100, 200, 'assetFileSize')];
      const ext = this.qe('Asset', validations);

      expect(Object.keys(ext).length).toBe(6);
      expect(path('size', false)).toBe(100);
      expect(path('size', true)).toBe(200);
      expect(path('width', false)).toBe(100);
      expect(path('width', true)).toBe(200);
      expect(path('height', false)).toBe(300);
      expect(path('height', true)).toBe(400);

      function path (property, lowerThan) {
        return ext['fields.file.details.' + property + '[' + (lowerThan ? 'l' : 'g') + 'te]'];
      }
    });
  });

  it('sets lables', function () {
    this.open({linkType: 'Entry'});
    expect(this.getScope().labels.title).toBe('Insert existing entry');
    this.open({linkType: 'Entry', type: 'Array'});
    expect(this.getScope().labels.title).toBe('Insert existing entries');
    this.open({linkType: 'Asset'});
    expect(this.getScope().labels.title).toBe('Insert existing asset');
    this.open({linkType: 'Asset', type: 'Array'});
    expect(this.getScope().labels.title).toBe('Insert existing assets');
  });

  describe('single CT prefetching', function () {
    it('fetches CT if a field links to a single CT', function () {
      const spaceContext = this.$inject('mocks/spaceContext').init();

      const ct = {};
      const fetchStub = spaceContext.publishedCTs.fetch.resolves(ct);

      let validation = {linkContentType: ['ctid1']};
      this.open({linkType: 'Entry', itemValidations: [validation]});

      sinon.assert.calledOnce(fetchStub.withArgs('ctid1'));
      expect(this.getScope().singleContentType).toBe(ct);

      validation = {linkContentType: 'ctid2'};
      this.open({linkType: 'Entry', itemValidations: [validation]});
      sinon.assert.calledOnce(fetchStub.withArgs('ctid2'));
    });

    it('uses asset pseudo-CT for all assets', function () {
      this.open({linkType: 'Asset'});
      expect(this.getScope().singleContentType).toBe(this.$inject('assetContentType'));
    });

    it('sets single CT to null if there is no such constraint', function () {
      this.open({linkType: 'Entry'});
      expect(this.getScope().singleContentType).toBe(null);
    });

    it('sets single CT to null if there is constraint > 1', function () {
      const validation = {linkContentType: ['ctid1', 'ctid2']};
      this.open({linkType: 'Entry', itemValidations: [validation]});
      expect(this.getScope().singleContentType).toBe(null);
    });
  });

  describe('opening from an extension', function () {
    beforeEach(function () {
      this.$inject('TheLocaleStore').getDefaultLocale = _.constant({code: 'de-DE'});

      this.openFromExt = (opts) => {
        const promise = this.entitySelector.openFromExtension(opts);
        this.$apply();
        return promise;
      };

      this.resolveWith = (value) => {
        this.openDialogStub.returns({promise: this.$q.resolve(value)});
      };

      this.rejectWith = (err) => {
        this.openDialogStub.returns({promise: this.$q.reject(err)});
      };

      this.resolveWith([{test: true}]);
    });

    it('selecting a single entity', function* () {
      const entry = yield this.openFromExt({entityType: 'Entry', multiple: false});
      expect(this.getConfig().multiple).toBe(false);
      expect(entry).toEqual({test: true});
    });

    it('selecting many entities', function* () {
      const selected = [{multiple: 1}, {multiple: 2}];
      this.resolveWith(selected);
      const entries = yield this.openFromExt({entityType: 'Entry', multiple: true});
      expect(this.getConfig().multiple).toBe(true);
      expect(entries).toEqual(selected);
    });

    it('resolves with null if selection was skipped', function* () {
      this.rejectWith(undefined);
      expect(yield this.openFromExt({entityType: 'Entry'})).toBe(null);
    });

    it('rejects with an original error thrown in the process', function* () {
      this.rejectWith(new Error('selector error'));

      const err = yield this.openFromExt({entityType: 'Entry'}).catch(_.identity);
      expect(err.message).toBe('selector error');
    });

    describe('converting options to validations', function () {
      it('"contentTypes" option converted to validation', function () {
        const spaceContext = this.$inject('mocks/spaceContext').init();
        spaceContext.publishedCTs.fetch.resolves({});

        const ids = ['blogpost', 'cat'];
        this.openFromExt({entityType: 'Entry', contentTypes: ids});
        expect(this.getConfig().linkedContentTypeIds).toEqual(ids);
      });

      it('"mix" and "max" options converted to validation', function () {
        this.openFromExt({entityType: 'Entry', multiple: true, min: 2, max: 4});
        const config = this.getConfig();
        expect(config.min).toBe(2);
        expect(config.max).toBe(4);
      });
    });

    describe('locale option', function () {
      it('uses provided locale', function () {
        this.openFromExt({entityType: 'Entry', locale: 'co-DE'});
        expect(this.getConfig().locale).toBe('co-DE');
      });

      it('uses default space locale if not provided', function () {
        this.openFromExt({entityType: 'Entry'});
        expect(this.getConfig().locale).toBe('de-DE');
      });
    });
  });
});
