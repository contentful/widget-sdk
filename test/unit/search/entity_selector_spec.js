'use strict';

describe('entitySelector', function () {
  beforeEach(function () {
    module('contentful/test');

    const entitySelector = this.$inject('entitySelector');
    const modalDialog = this.$inject('modalDialog');
    modalDialog.open = sinon.stub().resolves();

    this.open = function (field, links) {
      const promise = entitySelector.open(field, links);
      this.$apply();
      return promise;
    };

    this.getScope = function () {
      return modalDialog.open.lastCall.args[0].scopeData;
    };

    this.getConfig = function () {
      return this.getScope().config;
    };
  });

  function link (id) {
    return {sys: {id: id, type: 'Link'}};
  }

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
        const links = [link('a'), link('b')];
        this.open({linkType: 'Entry', itemValidations: [size(3, 6)]}, links);
        expect(this.getConfig().min).toBe(1);
        expect(this.getConfig().max).toBe(4);
      });

      it('uses 1 as minimal lower bound', function () {
        const links = [link('a'), link('b')];
        this.open({linkType: 'Entry', itemValidations: [size(2, 6)]}, links);
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

    it('extracts IDs of already linked entities', function () {
      this.open({linkType: 'Entry'}, [link('a'), link('b')]);
      expect(this.getConfig().linkedEntityIds).toEqual(['a', 'b']);
    });

    describe('processing validations', function () {
      it('defaults to an appropriate (empty) data structure', function () {
        this.open({linkType: 'Entry'});
        const config = this.getConfig();
        expect(config.linkedContentTypeIds).toEqual([]);
        expect(config.linkedMimetypeGroups).toEqual([]);
        expect(config.linkedFileSize).toEqual({});
        expect(config.linkedImageDimensions).toEqual({});
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

      it('extracts allowed asset size', function () {
        const validation = size(100, 200, 'assetFileSize');
        this.open({linkType: 'Asset', itemValidations: [validation]});
        expect(this.getConfig().linkedFileSize).toEqual({min: 100, max: 200});
      });

      it('extracts allowed image dimensions', function () {
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
      const ct = {};
      const fetchStub = sinon.stub().resolves(ct);
      this.$inject('spaceContext').fetchPublishedContentType = fetchStub;

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
});
