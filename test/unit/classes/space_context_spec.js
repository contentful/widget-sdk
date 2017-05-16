import * as sinon from 'helpers/sinon';

describe('spaceContext', function () {

  beforeEach(function () {
    this.Subscription = {
      newFromOrganization: sinon.stub()
    };
    this.organization = {sys: {id: 'ORG_ID'}};
    this.OrganizationContext = { create: sinon.stub().returns({organization: this.organization}) };
    module('contentful/test', ($provide) => {
      $provide.value('data/userCache', sinon.stub());
      $provide.value('data/editingInterfaces', sinon.stub());
      $provide.value('Subscription', this.Subscription);
      $provide.value('classes/OrganizationContext', this.OrganizationContext);
    });
    this.spaceContext = this.$inject('spaceContext');
    this.theLocaleStore = this.$inject('TheLocaleStore');
    this.theLocaleStore.resetWithSpace = sinon.stub();

    this.resetWithSpace = function (space) {
      space = space || makeSpaceMock();
      this.spaceContext.resetWithSpace(space);
      this.$apply();
      space.getContentTypes.resetHistory();
      space.getPublishedContentTypes.resetHistory();
      return space;
    };
  });

  describe('#purge', function () {
    it('gets rid of all space-related data', function () {
      const sc = this.spaceContext;
      sc.purge();

      ['space', 'users', 'widgets'].forEach(function (field) {
        expect(sc[field]).toEqual(null);
      });
      ['contentTypes', 'publishedContentTypes'].forEach(function (field) {
        expect(sc[field]).toEqual([]);
      });
    });
  });

  describe('#resetWithSpace()', function () {
    let SPACE, Widgets;

    beforeEach(function () {
      const createEditingInterfaces = this.$inject('data/editingInterfaces');
      createEditingInterfaces.returns('EI');

      Widgets = this.$inject('widgets');
      Widgets.setSpace = sinon.stub().defers();

      SPACE = makeSpaceMock();
      SPACE.getContentTypes.defers();
      SPACE.getPublishedContentTypes.defers();
      sinon.stub(this.spaceContext, 'refreshContentTypes');
      this.spaceContext.contentTypes = [{}];
      this.result = this.spaceContext.resetWithSpace(SPACE);
    });

    afterEach(function () {
      SPACE = Widgets = null;
    });

    it('sets space on context', function () {
      expect(this.spaceContext.space).toBe(SPACE);
    });

    it('clears content types', function () {
      expect(this.spaceContext.contentTypes.length).toEqual(0);
    });

    it('refreshes locales', function () {
      sinon.assert.calledOnce(this.theLocaleStore.resetWithSpace);
    });

    it('creates the user cache', function () {
      const userCache = {};
      const createUserCache = this.$inject('data/userCache');
      createUserCache.resetHistory().returns(userCache);
      this.spaceContext.resetWithSpace(SPACE);
      sinon.assert.calledWithExactly(createUserCache, SPACE);
      expect(this.spaceContext.users).toBe(userCache);
    });

    it('resets Widgets store', function () {
      sinon.assert.calledWith(Widgets.setSpace, SPACE);
    });

    it('sets the widgets property from the widgets service', function () {
      expect(this.spaceContext.widgets).toBe(null);
      Widgets.setSpace.resolve('WIDGETS');
      this.$apply();
      expect(this.spaceContext.widgets).toBe('WIDGETS');
    });

    it('resolves when widgets are set', function () {
      const done = sinon.stub();
      this.result.then(done);

      this.$apply();
      sinon.assert.notCalled(done);

      Widgets.setSpace.resolve();
      SPACE.getContentTypes.resolve();
      SPACE.getPublishedContentTypes.resolve([]);
      this.$apply();
      sinon.assert.called(done);
    });

    it('sets #editingInterfaces', function () {
      const createEditingInterfaces = this.$inject('data/editingInterfaces');
      sinon.assert.calledOnce(createEditingInterfaces);
      expect(this.spaceContext.editingInterfaces).toEqual('EI');
    });

    describe('updated `.subscription` value on context', function () {
      let ORGANIZATION, SUBSCRIPTION;
      beforeEach(function () {
        ORGANIZATION = {};
        SUBSCRIPTION = {};
        this.Subscription.newFromOrganization.reset();
        this.Subscription.newFromOrganization
          .withArgs(ORGANIZATION).returns(SUBSCRIPTION);
      });

      it('gets built from context `organization` data', function () {
        SPACE.data = { organization: ORGANIZATION };
        this.spaceContext.resetWithSpace(SPACE);

        sinon.assert.calledOnce(this.Subscription.newFromOrganization);
        expect(this.spaceContext.subscription).toBe(SUBSCRIPTION);
      });

      it('is set to `null` if no organization is set on `data`', function () {
        this.spaceContext.resetWithSpace(SPACE);

        sinon.assert.notCalled(this.Subscription.newFromOrganization);
        expect(this.spaceContext.subscription).toBe(null);
      });
    });

    it('sets #publishedContentTypes from refreshed CT list', function* () {
      Widgets.setSpace.resolve();
      SPACE.getContentTypes.resolve([]);

      SPACE.getPublishedContentTypes.resolve([
        makeCtMock('A'), makeCtMock('B')
      ]);
      yield this.result;
      expect(
        this.spaceContext.publishedContentTypes.map((ct) => ct.getId())
      ).toEqual(['A', 'B']);
    });

    it('inits organization context', function () {
      expect(this.spaceContext.organizationContext.organization).toEqual(this.organization);
    });
  });

  describe('#getData() ', function () {
    beforeEach(function () {
      this.space = this.resetWithSpace();
    });

    it('returns undefined for an invalid path', function () {
      expect(this.spaceContext.getData('x.y.z')).toBeUndefined();
    });

    it('returns provided default value for an invalid path', function () {
      const obj = {};
      expect(this.spaceContext.getData('x.y.z', obj)).toBe(obj);
    });

    it('returns value if a path is correct', function () {
      const obj = {};
      this.space.data.x = {y: {z: obj}};
      expect(this.spaceContext.getData('x.y.z')).toBe(obj);
    });
  });

  describe('#entryTitle()', function () {
    let entry;
    beforeEach(function () {
      entry = {
        getContentTypeId: _.constant('CTID'),
        getType: _.constant('Entry'),
        data: {
          fields: {
            title: {
              'en-US': 'the title'
            }
          }
        }
      };
      this.space = this.resetWithSpace();
      this.space.getDefaultLocale = sinon.stub().returns('en-US');

      const CTRepo = this.$inject('data/ContentTypeRepo/Published');
      this.spaceContext.publishedCTs = sinon.stubAll(CTRepo.create());
    });

    it('fetched successfully', function () {
      this.spaceContext.publishedCTs.get.returns(makeCtMock('CTID', {
        displayField: 'title',
        fields: {id: 'title', type: 'Symbol'}
      }));
      expect(this.spaceContext.entryTitle(entry)).toBe('the title');
      expect(this.spaceContext.entryTitle(entry, 'en-US', true)).toBe('the title');
      expect(this.spaceContext.entityTitle(entry)).toBe('the title');
    });

    it('gets no title, falls back to default', function () {
      this.spaceContext.publishedCTs.get.returns({data: {}});
      expect(this.spaceContext.entryTitle(entry)).toBe('Untitled');
      expect(this.spaceContext.entryTitle(entry, 'en-US', true)).toBe(null);
      expect(this.spaceContext.entityTitle(entry)).toBe(null);
    });

    it('handles an exception, falls back to default', function () {
      this.spaceContext.publishedCTs.get.returns({});
      expect(this.spaceContext.entryTitle(entry)).toBe('Untitled');
      expect(this.spaceContext.entityTitle(entry)).toBe(null);
    });

    it('fetched successfully but title is empty', function () {
      entry.data.fields.title = '   ';
      expect(this.spaceContext.entryTitle(entry)).toBe('Untitled');
      expect(this.spaceContext.entryTitle(entry, undefined, true)).toBe(null);
      expect(this.spaceContext.entityTitle(entry)).toBe(null);
    });

    it('fetched successfully but title doesn\'t exist', function () {
      delete entry.data.fields.title;
      expect(this.spaceContext.entryTitle(entry)).toEqual('Untitled');
      expect(this.spaceContext.entryTitle(entry, undefined, true)).toEqual(null);
      expect(this.spaceContext.entityTitle(entry)).toEqual(null);
    });
  });

  describe('#assetTitle()', function () {
    let asset;
    beforeEach(function () {
      asset = {
        getType: _.constant('Asset'),
        data: {
          fields: {
            title: {
              'en-US': 'the title'
            }
          }
        }
      };
    });

    it('fetched successfully', function () {
      expect(this.spaceContext.assetTitle(asset)).toBe('the title');
      expect(this.spaceContext.assetTitle(asset, 'en-US', true)).toBe('the title');
      expect(this.spaceContext.entityTitle(asset)).toBe('the title');
    });

    it('gets no title, falls back to default', function () {
      asset.data = {fields: {}};
      expect(this.spaceContext.assetTitle(asset)).toBe('Untitled');
      expect(this.spaceContext.assetTitle(asset, 'en-US', true)).toBe(null);
      expect(this.spaceContext.entityTitle(asset)).toBe(null);
    });

    it('handles an exception, falls back to default', function () {
      asset.data = {};
      expect(this.spaceContext.assetTitle(asset)).toBe('Untitled');
      expect(this.spaceContext.entityTitle(asset)).toBe(null);
    });

    it('fetched successfully but title is empty', function () {
      asset.data.fields.title = '   ';
      expect(this.spaceContext.assetTitle(asset)).toBe('Untitled');
      expect(this.spaceContext.entityTitle(asset)).toBe(null);
    });

    it('fetched successfully but title doesn\'t exist', function () {
      delete asset.data.fields.title;
      expect(this.spaceContext.assetTitle(asset)).toBe('Untitled');
      expect(this.spaceContext.entityTitle(asset)).toBe(null);
    });

    it('gets a localized field', function () {
      expect(this.spaceContext.localizedField(asset, 'data.fields.title')).toBe('the title');
    });
  });

  describe('#refreshContentTypes()', function () {
    beforeEach(function () {
      this.space = this.resetWithSpace();
    });

    it('updates "contentTypes" property', function () {
      const cts = [
        makeCtMock('A'),
        makeCtMock('B')
      ];
      this.space.getContentTypes.resolves(cts);
      this.spaceContext.refreshContentTypes();
      this.$apply();
      expect(this.spaceContext.contentTypes).toEqual(cts);
    });

    it('updates "publishedContentTypes" property', function () {
      const cts = [
        makeCtMock('A'),
        makeCtMock('B')
      ];
      this.space.getPublishedContentTypes.resolves(cts);
      this.spaceContext.refreshContentTypes();
      this.$apply();
      expect(this.spaceContext.publishedContentTypes).toEqual(cts);
    });

    it('enqueues requests for content types', function () {
      const p1 = this.spaceContext.refreshContentTypes();
      const p2 = this.spaceContext.refreshContentTypes();
      expect(p1).toBe(p2);
      sinon.assert.calledTwice(this.space.getContentTypes);
    });

    it('results in an error message if API broken', function () {
      const handler = this.$inject('ReloadNotification').apiErrorHandler;
      this.space.getContentTypes.rejects({statusCode: 500});
      this.spaceContext.refreshContentTypes();
      this.$apply();
      sinon.assert.called(handler);
    });

    it('does not include deleted published content Types', function () {
      this.space.getContentTypes.resolves([
        makeCtMock('A'),
        makeCtMock('B', {isDeleted: true}),
        makeCtMock('C')
      ]);
      this.spaceContext.refreshContentTypes();
      this.$apply();
      const ctIds = this.spaceContext.contentTypes.map((ct) => ct.getId());
      expect(ctIds).toEqual(['A', 'C']);
    });
  });

  describe('#displayedFieldForType()', function () {
    beforeEach(function () {
      const CTRepo = this.$inject('data/ContentTypeRepo/Published');
      this.spaceContext.publishedCTs = sinon.stubAll(CTRepo.create());
    });

    it('returns the field', function () {
      const field = {id: 'name'};
      this.spaceContext.publishedCTs.get.returns({
        data: {
          displayField: 'name',
          fields: [field]
        }
      });
      expect(this.spaceContext.displayFieldForType('type')).toBe(field);
    });

    it('returns nothing', function () {
      const field = {id: 'name'};
      this.spaceContext.publishedCTs.get.returns({
        data: {
          displayField: 'othername',
          fields: [field]
        }
      });
      expect(this.spaceContext.displayFieldForType('type')).toBeUndefined();
    });
  });


  describe('finding entity fields', function () {
    const ASSET_LINK_XX = {
      sys: {id: 'ASSET_1'}
    };
    const ASSET_LINK_IT = {
      sys: {id: 'ASSET_2'}
    };

    beforeEach(function () {
      this.default_locale = {internal_code: 'xx'};
      this.spaceContext.space = {
        getDefaultLocale: sinon.stub().returns(this.default_locale)
      };

      this.fields = [
        {type: 'Number', id: 'NUMBER'},
        {type: 'Symbol', id: 'SYMBOL'},
        {type: 'Text', id: 'TEXT'},
        {type: 'Link', linkType: 'Entry', id: 'ENTRY'},
        {type: 'Link', linkType: 'Asset', id: 'ASSET'}
      ];
      this.ct = {
        data: {
          fields: this.fields
        }
      };

      this.entry = {
        getContentTypeId: _.constant('CTID'),
        data: {
          fields: {
            NUMBER: {xx: 'NUMBER'},
            SYMBOL: {xx: 'SYMBOL VAL', de: 'SYMBOL VAL DE'},
            TEXT: {en: 'VAL EN', xx: 'VAL', de: 'VAL DE'},
            ASSET: {xx: ASSET_LINK_XX, it: ASSET_LINK_IT}
          }
        }
      };

      const CTRepo = this.$inject('data/ContentTypeRepo/Published');
      this.spaceContext.publishedCTs = sinon.stubAll(CTRepo.create());
      this.spaceContext.publishedCTs.get.withArgs('CTID').returns(this.ct);
    });

    describe('#findLocalizedField()', function () {
      it('returns undefined if no field can be found', function () {
        const val = this.spaceContext.findLocalizedField(
          this.entry, {type: 'AnotherType'});

        expect(val).toBe(undefined);
      });

      it('returns value of first matching field`s value', function () {
        const val = this.spaceContext.findLocalizedField(
          this.entry, {type: 'Symbol'});

        expect(val).toBe('SYMBOL VAL');
      });

      it('returns value for given locale', function () {
        const val = this.spaceContext.findLocalizedField(
          this.entry, 'it', {type: 'Link', linkType: 'Asset'});

        expect(val).toBe(ASSET_LINK_IT);
      });

      it('returns value for enity`s first locale code', function () {
        delete this.entry.data.fields.TEXT.xx; // Delete default field

        const val = this.spaceContext.findLocalizedField(
          this.entry, {type: 'Text'});

        expect(val).toBe('VAL EN');
      });

      it('accepts a callback for the search', function () {
        const fields = [];
        const val = this.spaceContext.findLocalizedField(
          this.entry, function (field) {
            fields.push(field);
          });

        expect(fields).toEqual(this.fields);
        expect(val).toEqual(undefined);
      });
    });

    describe('#entityDescription()', function () {
      it('returns value of first text or symbol field, falls back to default locale', function () {
        const desc = this.spaceContext.entityDescription(this.entry);
        expect(desc).toBe('SYMBOL VAL');
      });

      it('returns value of first text or symbol field for given locale', function () {
        const desc = this.spaceContext.entityDescription(this.entry, 'de');
        expect(desc).toBe('SYMBOL VAL DE');
      });

      describe('skips display field', function () {
        beforeEach(function () {
          _.remove(this.fields, function (field) {
            return field.id === 'TEXT';
          });
          delete this.entry.data.fields.TEXT;
          this.ct.data.displayField = 'SYMBOL';
        });

        it('returns undefined if there is not other field', function () {
          const desc = this.spaceContext.entityDescription(this.entry);
          expect(desc).toBe(undefined);
        });

        it('returns value of the next text field', function () {
          this.ct.data.fields.push({type: 'Text', id: 'TEXT_2'});
          this.entry.data.fields.TEXT_2 = {xx: 'VAL 2', de: 'VAL 2 DE'};

          const desc = this.spaceContext.entityDescription(this.entry);
          expect(desc).toBe('VAL 2');
          const descDe = this.spaceContext.entityDescription(this.entry, 'de');
          expect(descDe).toBe('VAL 2 DE');
        });
      });

      it('returns undefined if content type is not available', function () {
        this.spaceContext.publishedCTs.get = sinon.stub().returns(null);
        const desc = this.spaceContext.entityDescription({
          getContentTypeId: _.constant()
        });
        expect(desc).toEqual(undefined);
      });
    });

    describe('#entryImage', function () {
      beforeEach(function () {
        this.file = {details: {image: {}}};
        const asset = {};
        dotty.put(asset, 'data.fields.file.xx', this.file);

        this.spaceContext.space.getAsset = sinon.stub();
        this.spaceContext.space.getAsset
          .withArgs(ASSET_LINK_XX.sys.id).resolves(asset)
          .withArgs(ASSET_LINK_IT.sys.id).rejects();
      });

      pit('resolves a promise with an image file', function () {
        return this.spaceContext.entryImage(this.entry)
        .then((file) => expect(file).toBe(this.file));
      });

      pit('resolves a promise with an image file for given locale', function () {
        return this.spaceContext.entryImage(this.entry, 'xx')
        .then((file) => expect(file).toBe(this.file));
      });

      pit('resolves a promise with default locale`s image if unknown locale', function () {
        return this.spaceContext.entryImage(this.entry, 'foo')
        .then((file) => expect(file).toBe(this.file));
      });

      pit('resolves a promise with null if no linked asset field in CT', function () {
        _.remove(this.fields, function (field) {
          return field.type === 'Link';
        });
        return this.spaceContext.entryImage(this.entry)
        .then((file) => expect(file).toBe(null));
      });

      pit('resolves a promise with null if linked asset is not an image', function () {
        delete this.file.details.image;

        return this.spaceContext.entryImage(this.entry)
        .then((file) => expect(file).toBe(null));
      });

      pit('resolves a promise with null if dead link for given locale', function () {
        // TODO: We might want to refine this edge case's behavior and try to load
        //       another locale's image then.
        return this.spaceContext.entryImage(this.entry, 'it')
        .then((file) => expect(file).toBe(null));
      });
    });
  });

  describe('#docConnection and #docPool', function () {
    beforeEach(function () {
      const ShareJSConnection = this.$inject('data/sharejs/Connection');
      const DocumentPool = this.$inject('data/sharejs/DocumentPool');
      this.createConnection = ShareJSConnection.create = sinon.stub().returns({});
      this.createPool = DocumentPool.create = sinon.stub();
    });

    it('creates on resetSpace', function () {
      this.spaceContext.resetWithSpace(makeSpaceMock());
      sinon.assert.calledOnce(this.createConnection);
      sinon.assert.calledOnce(this.createPool.withArgs(this.spaceContext.docConnection));
    });

    it('cleans up on resetSpace', function () {
      const stubs = [sinon.stub(), sinon.stub()];
      this.spaceContext.docConnection = {close: stubs[0]};
      this.spaceContext.docPool = {destroy: stubs[1]};
      this.spaceContext.resetWithSpace(makeSpaceMock());
      stubs.forEach((s) => sinon.assert.calledOnce(s));
    });

    it('cleans up on purge', function () {
      const stubs = [sinon.stub(), sinon.stub()];
      this.spaceContext.docConnection = {close: stubs[0]};
      this.spaceContext.docPool = {destroy: stubs[1]};
      this.spaceContext.purge();
      stubs.forEach((s) => sinon.assert.calledOnce(s));
    });
  });

  function makeCtMock (id, opts = {}) {
    return {
      data: {
        sys: {id},
        displayField: opts.displayField,
        fields: opts.fields || []
      },
      getId: _.constant(id),
      isDeleted: _.constant(opts.isDeleted === true),
      getName: _.constant(id)
    };
  }

  function makeSpaceMock () {
    return {
      data: {},
      endpoint: sinon.stub().returns({
        get: sinon.stub().rejects()
      }),
      getId: sinon.stub().returns('SPACE_ID'),
      getContentTypes: sinon.stub().resolves([]),
      getPublishedContentTypes: sinon.stub().resolves([])
    };
  }

});
