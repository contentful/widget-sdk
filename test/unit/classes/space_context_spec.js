'use strict';

describe('spaceContext', function () {

  beforeEach(function () {
    this.Subscription = {
      newFromOrganization: sinon.stub()
    };
    module('contentful/test', ($provide) => {
      $provide.value('data/userCache', sinon.stub());
      $provide.value('data/editingInterfaces', sinon.stub());
      $provide.value('Subscription', this.Subscription);
    });
    this.spaceContext = this.$inject('spaceContext');
    this.theLocaleStore = this.$inject('TheLocaleStore');
    this.theLocaleStore.resetWithSpace = sinon.stub();
  });

  describe('#purge', function () {
    it('gets rid of all space-related data', function () {
      var sc = this.spaceContext;
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
    var SPACE, Widgets;

    beforeEach(function () {
      var createEditingInterfaces = this.$inject('data/editingInterfaces');
      createEditingInterfaces.returns('EI');

      Widgets = this.$inject('widgets');
      Widgets.setSpace = sinon.stub().defers();

      SPACE = makeSpaceMock();
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
      var userCache = {};
      var createUserCache = this.$inject('data/userCache');
      createUserCache.reset().returns(userCache);
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
      var done = sinon.stub();
      this.result.then(done);

      this.$apply();
      sinon.assert.notCalled(done);

      Widgets.setSpace.resolve();
      SPACE.getContentTypes.resolve();
      SPACE.getPublishedContentTypes.resolve();
      this.$apply();
      sinon.assert.called(done);
    });

    it('sets #editingInterfaces', function () {
      var createEditingInterfaces = this.$inject('data/editingInterfaces');
      sinon.assert.calledOnce(createEditingInterfaces);
      expect(this.spaceContext.editingInterfaces).toEqual('EI');
    });

    describe('updated `.subscription` value on context', function () {
      var ORGANIZATION, SUBSCRIPTION;
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
  });

  describe('with a space', function () {
    var space, $q, cfStub;

    beforeEach(function () {
      cfStub = this.$inject('cfStub');
      space = cfStub.space('test');
      space.getContentTypes = sinon.stub().resolves([]);
      space.getPublishedContentTypes = sinon.stub().resolves([]);
      $q = this.$inject('$q');

      // do not refresh  CTs while initializing with space
      sinon.stub(this.spaceContext, 'refreshContentTypes');
      this.spaceContext.resetWithSpace(space);
      this.$apply();
      this.spaceContext.refreshContentTypes.restore();
    });

    afterEach(function () {
      space = $q = cfStub = null;
    });

    it('has a space', function () {
      expect(this.spaceContext.space).toBeDefined();
    });

    it('gets current space id', function () {
      expect(this.spaceContext.getId()).toBe('test');
    });

    describe('getting space data', function () {
      it('returns undefined for an invalid path', function () {
        expect(this.spaceContext.getData('x.y.z')).toBeUndefined();
      });

      it('returns provided default value for an invalid path', function () {
        var obj = {};
        expect(this.spaceContext.getData('x.y.z', obj)).toBe(obj);
      });

      it('returns value if a path is correct', function () {
        var obj = {};
        space.data.x = {y: {z: obj}};
        expect(this.spaceContext.getData('x.y.z')).toBe(obj);
      });
    });

    describe('getting content types from server', function () {
      var getContentTypes, getPublishedContentTypes;
      var contentTypes;
      beforeEach(function () {
        contentTypes = [
          cfStub.contentType(space, 'content_type1', 'contentType1',
                             [{id: 'title', name: 'Title', type: 'Text'}],
                             { displayField: 'title' }),
          cfStub.contentType(space, 'content_type2', 'contentType2')
        ];
        this.spaceContext.space.getContentTypes = getContentTypes = sinon.stub().resolves(contentTypes);
        this.spaceContext.space.getPublishedContentTypes = getPublishedContentTypes = sinon.stub().resolves(contentTypes);
      });

      it('refreshes content types', function () {
        getContentTypes.returns($q.when(contentTypes.concat().reverse()));
        this.spaceContext.refreshContentTypes();
        this.$apply();
        expect(this.spaceContext.contentTypes[0].getName()).toEqual('contentType1');
        sinon.assert.called(getPublishedContentTypes);
      });

      it('enqueues requests for content types', function () {
        getContentTypes.returns($q.when(contentTypes.concat().reverse()));
        var p1 = this.spaceContext.refreshContentTypes();
        var p2 = this.spaceContext.refreshContentTypes();
        this.$apply();
        expect(p1).toBe(p2);
        sinon.assert.calledTwice(getContentTypes);
      });

      it('results in an error message if API broken', function () {
        var handler = this.$inject('ReloadNotification').apiErrorHandler;
        getContentTypes.returns($q.reject({statusCode: 500}));
        this.spaceContext.refreshContentTypes();
        this.$apply();
        sinon.assert.called(handler);
      });

      describe('refresh with waiting for changes', function () {
        beforeEach(function () {
          this.spaceContext.refreshContentTypes();
          this.$apply();

          var $timeout = this.$inject('$timeout');
          this.flush = function () {
            this.$apply();
            $timeout.flush();
          }.bind(this);

          this.removeSecondCt = function () {
            this.spaceContext.unregisterPublishedContentType(contentTypes[1]);
            var slice = contentTypes.slice(0, 1);
            getContentTypes.resolves(slice);
            getPublishedContentTypes.resolves(slice);
          }.bind(this);
        });

        pit('resolves with content types when one was added', function () {
          var newCt = cfStub.contentType(space, 'content_type3', 'contentType3');
          var cts = contentTypes.concat(newCt);
          getContentTypes.resolves(cts);
          getPublishedContentTypes.resolves(cts);
          return this.spaceContext.refreshContentTypesUntilChanged().then(function (data) {
            expect(data.length).toBe(3);
            expect(data[2]).toBe(newCt);
          });
        });

        pit('resolves with content types when it one was removed', function () {
          this.removeSecondCt();
          return this.spaceContext.refreshContentTypesUntilChanged().then(function (data) {
            expect(data.length).toBe(1);
            expect(data[0]).toBe(contentTypes[0]);
          });
        });

        pit('it retries if content types are not changed', function () {
          var p = this.spaceContext.refreshContentTypesUntilChanged();

          this.removeSecondCt();
          this.flush();

          return p.then(function (data) {
            expect(data.length).toBe(1);
            // asserting that was called thrice:
            // (1) initial refresh, (2) no data changed, (3) changed data
            sinon.assert.calledThrice(getContentTypes);
            sinon.assert.calledThrice(getPublishedContentTypes);
          });
        });

        pit('it tries 5 times and resolves this old content types if not changed', function () {
          var p = this.spaceContext.refreshContentTypesUntilChanged();

          _.range(5).forEach(this.flush);

          return p.then(function (data) {
            expect(data.length).toBe(2);
            // (1) initial refresh, (2) first request, (3-7) retries
            expect(getContentTypes.callCount).toBe(7);
          });
        });
      });

      describe('refreshes published content types', function () {
        it('has content types', function () {
          this.spaceContext.refreshContentTypes();
          this.$apply();
          expect(this.spaceContext.publishedContentTypes.length).toBeGreaterThan(0);
          expect(this.spaceContext.publishedContentTypes[0].getName()).toEqual('contentType1');
        });

        it('merges context types from client and server together', function () {
          this.spaceContext.publishedContentTypes = [ contentTypes[0] ];
          this.spaceContext.refreshContentTypes();
          this.$apply();
          expect(this.spaceContext.publishedContentTypes.length).toBe(2);
        });

        it('does not include deleted published content Types', function () {
          sinon.stub(contentTypes[1], 'isDeleted').returns(true);
          this.spaceContext.refreshContentTypes();
          this.$apply();
          expect(this.spaceContext.publishedContentTypes.length).toBe(1);
          expect(_.includes(this.spaceContext.publishedContentTypes, contentTypes[1])).toBe(false);
        });

        it('registers a published content type', function () {
          var contentType = cfStub.contentType(space, 'content_type3', 'contentType3');
          this.spaceContext.registerPublishedContentType(contentType);
          expect(this.spaceContext.publishedContentTypes[0]).toBe(contentType);
        });

        it('removes a content type', function () {
          // TODO test this without refresh calls
          this.spaceContext.refreshContentTypes();
          this.$apply();
          this.spaceContext.removeContentType(contentTypes[0]);
          expect(this.spaceContext.contentTypes[0].getName()).toEqual('contentType2');
        });

        it('gets a published type for a given entry', function () {
          // TODO test this without refresh calls
          this.spaceContext.refreshContentTypes();
          this.$apply();
          var entry = cfStub.entry(space, 'entry2', 'content_type1');
          expect(this.spaceContext.publishedTypeForEntry(entry)).toBe(contentTypes[0]);
        });

        describe('gets an entry title', function () {
          var entry;
          beforeEach(function () {
            entry = cfStub.entry(space, 'entry1',
                                 'content_type1',
                                 { title: { 'en-US': 'the title' } });
            getContentTypes.returns($q.resolve(contentTypes.concat().reverse()));
            getPublishedContentTypes.returns($q.resolve(contentTypes.concat().reverse()));
            this.spaceContext.refreshContentTypes();
            this.$apply();
          });

          it('fetched successfully', function () {
            expect(this.spaceContext.entryTitle(entry)).toBe('the title');
            expect(this.spaceContext.entryTitle(entry, 'en-US', true)).toBe('the title');
            expect(this.spaceContext.entityTitle(entry)).toBe('the title');
          });

          it('gets no title, falls back to default', function () {
            sinon.stub(this.spaceContext, 'publishedTypeForEntry').returns({
              data: {}
            });
            expect(this.spaceContext.entryTitle(entry)).toBe('Untitled');
            expect(this.spaceContext.entryTitle(entry, 'en-US', true)).toBe(null);
            expect(this.spaceContext.entityTitle(entry)).toBe(null);
          });

          it('handles an exception, falls back to default', function () {
            sinon.stub(this.spaceContext, 'publishedTypeForEntry').returns({});
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

          describe('unregistering a published Content Type', function () {
            beforeEach(function () {
              this.spaceContext.unregisterPublishedContentType(contentTypes[0]);
            });

            it('should not be included in the list anymore', function () {
              expect(this.spaceContext.publishedContentTypes).not.toContain(contentTypes[0]);
            });

            it('should not be found by publishedTypeForEntry anymore', function () {
              var entry = {
                getContentTypeId: sinon.stub().returns('contentType1')
              };
              expect(this.spaceContext.publishedTypeForEntry(entry)).toBe(undefined);
              expect(this.spaceContext.publishedContentTypes).not.toContain(contentTypes[0]);
            });
          });

        });

        describe('gets an asset title', function () {
          var asset;
          beforeEach(function () {
            asset = cfStub.asset(space, 'asset1', {
              title: {
                'en-US': 'the title'
              }
            });
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

      });

    });

    describe('forced fetch of content types', function () {
      var spaceContext, $q;

      beforeEach(function () {
        spaceContext = this.spaceContext;
        $q = this.$inject('$q');

        spaceContext._publishedContentTypesHash = {
          already_fetched: { data: { sys: { id: 'already_fetched' } } }
        };
        sinon.stub(this.spaceContext, 'refreshContentTypes', function () {
          var ct = { data: { sys: { id: 'to_be_fetched' } } };
          spaceContext._publishedContentTypesHash['to_be_fetched'] = ct;
          return $q.resolve(ct);
        });
      });

      pit('returns promise immediately when content type is already there', function () {
        return spaceContext.fetchPublishedContentType('already_fetched')
          .then(function (ct) {
            expect(ct.data.sys.id).toBe('already_fetched');
            sinon.assert.notCalled(spaceContext.refreshContentTypes);
          });
      });

      pit('returns promise after refreshing content types if one was not found', function () {
        return spaceContext.fetchPublishedContentType('to_be_fetched')
          .then(function (ct) {
            expect(ct.data.sys.id).toBe('to_be_fetched');
            sinon.assert.called(spaceContext.refreshContentTypes);
          });
      });
    });

    describe('getting existing published content types locally', function () {
      var contentType;

      beforeEach(function () {
        this.spaceContext._publishedContentTypesHash = {
          hashId: 'contentType1'
        };
        this.spaceContext.refreshContentTypes = sinon.stub();
        contentType = this.spaceContext.getPublishedContentType('hashId');
      });

      it('gets a published content type', function () {
        expect(contentType).toBe('contentType1');
      });

      it('does not refresh content types', function () {
        sinon.assert.notCalled(this.spaceContext.refreshContentTypes);
      });

      it('does not set a flag for the content type as being missing', function () {
        expect(this.spaceContext._publishedContentTypeIsMissing.hashId).toBeUndefined();
      });

      it('gets a published type for a given entry', function () {
        var entry = cfStub.entry(space, 'entry1', 'hashId');
        expect(this.spaceContext.publishedTypeForEntry(entry)).toBe('contentType1');
      });

    });

    describe('getting missing published content types locally', function () {
      var contentType;

      beforeEach(function () {
        this.spaceContext._publishedContentTypesHash = {};
        this.spaceContext.refreshContentTypes = sinon.stub();
        contentType = this.spaceContext.getPublishedContentType('hashId');
      });

      it('gets a published content type', function () {
        expect(contentType).toBeUndefined();
      });

      it('refreshes content types', function () {
        sinon.assert.called(this.spaceContext.refreshContentTypes);
      });

      it('sets a flag for the content type as being missing', function () {
        expect(this.spaceContext._publishedContentTypeIsMissing.hashId).toBeDefined();
      });

      it('gets no published type for a given entry', function () {
        var entry = cfStub.entry(space, 'entry1', 'hashId');
        expect(this.spaceContext.publishedTypeForEntry(entry)).toBeUndefined();
      });

    });

    describe('getting display field for a given type', function () {
      beforeEach(function () {
        this.spaceContext.getPublishedContentType = sinon.stub();
      });

      it('returns the field', function () {
        var field = {id: 'name'};
        this.spaceContext.getPublishedContentType.returns({
          data: {
            displayField: 'name',
            fields: [field]
          }
        });
        expect(this.spaceContext.displayFieldForType('type')).toBe(field);
      });

      it('returns nothing', function () {
        var field = {id: 'name'};
        this.spaceContext.getPublishedContentType.returns({
          data: {
            displayField: 'othername',
            fields: [field]
          }
        });
        expect(this.spaceContext.displayFieldForType('type')).toBeUndefined();
      });

    });
  });


  describe('#getPublishedContentType()', function () {
    var entry, $q;

    beforeEach(function () {
      var cfStub = this.$inject('cfStub');
      var space = cfStub.space('test');
      space.getContentTypes = sinon.stub().resolves([]);
      space.getPublishedContentTypes = sinon.stub().resolves([]);
      $q = this.$inject('$q');
      sinon.stub(this.spaceContext, 'refreshContentTypes');
      this.spaceContext.resetWithSpace(space);
      this.$apply();
      this.spaceContext.refreshContentTypes.restore();
      entry = { getContentTypeId: function () { return 'foo'; } };
      sinon.spy(this.spaceContext, 'refreshContentTypes');
    });

    afterEach(function () {
      entry = $q = null;
    });

    it('should not trigger a refresh when resolving a known published content type', function () {
      this.spaceContext._publishedContentTypesHash = { foo: 'Bar' };

      expect(this.spaceContext.publishedTypeForEntry(entry)).toBe('Bar');
      sinon.assert.notCalled(this.spaceContext.refreshContentTypes);
    });

    it('should trigger a refresh when attempting to resolve an unknown published content type', function () {
      this.spaceContext.publishedTypeForEntry(entry);
      sinon.assert.called(this.spaceContext.refreshContentTypes);
    });

    it('should mark a published type as not missing after retrieval', function () {
      this.spaceContext._publishedContentTypeIsMissing['foo'] = true;
      var ctsPromise = $q.resolve([{
        getName: function () { return ''; },
        getId: function () { return 'foo'; },
        isDeleted: sinon.stub().returns(false),
        data: { sys: {id: 'foo'} }
      }]);
      this.spaceContext.space.getContentTypes = sinon.stub().returns(ctsPromise);
      this.spaceContext.space.getPublishedContentTypes = sinon.stub().returns(ctsPromise);
      this.spaceContext.refreshContentTypes();
      this.$apply();
      expect(this.spaceContext._publishedContentTypeIsMissing['foo']).toBeFalsy();
    });

    it('should not trigger a refresh on content types that are known missing', function () {
      this.spaceContext._publishedContentTypeIsMissing['foo'] = true;
      this.spaceContext.publishedTypeForEntry(entry);
      sinon.assert.notCalled(this.spaceContext.refreshContentTypes);
    });

    it('should not trigger a refresh for content types if called twice in quick succession', function () {
      this.spaceContext.getPublishedContentType('contentTypeId');
      expect(this.spaceContext.refreshContentTypes.callCount).toBe(1);
      this.spaceContext.getPublishedContentType('contentTypeId');
      expect(this.spaceContext.refreshContentTypes.callCount).toBe(1);
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
        data: {
          fields: {
            NUMBER: {xx: 'NUMBER'},
            SYMBOL: {xx: 'SYMBOL VAL', de: 'SYMBOL VAL DE'},
            TEXT: {en: 'VAL EN', xx: 'VAL', de: 'VAL DE'},
            ASSET: {xx: ASSET_LINK_XX, it: ASSET_LINK_IT}
          }
        }
      };

      this.spaceContext.publishedTypeForEntry =
        sinon.stub().withArgs(this.entry).returns(this.ct);
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
        var fields = [];
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
        this.spaceContext.publishedTypeForEntry = sinon.stub().returns(null);
        const desc = this.spaceContext.entityDescription({});
        expect(desc).toEqual(undefined);
      });
    });

    describe('#entryImage', function () {
      beforeEach(function () {
        this.file = {details: {image: {}}};
        var asset = {};
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

  describe('#docConnection', function () {
    beforeEach(function () {
      const ShareJSConnection = this.$inject('data/ShareJS/Connection');
      this.createConnection = ShareJSConnection.create = sinon.stub();
    });

    it('is created on resetSpace', function () {
      this.spaceContext.resetWithSpace(makeSpaceMock());
      sinon.assert.calledOnce(this.createConnection);
    });

    it('is closed on resetSpace', function () {
      const close = sinon.stub();
      this.spaceContext.docConnection = {close};
      this.spaceContext.resetWithSpace(makeSpaceMock());
      sinon.assert.calledOnce(close);
    });

    it('is closed on purge', function () {
      const close = sinon.stub();
      this.spaceContext.docConnection = {close};
      this.spaceContext.purge();
      sinon.assert.calledOnce(close);
    });
  });

  function makeSpaceMock () {
    return {
      endpoint: sinon.stub().returns({
        get: sinon.stub().rejects()
      }),
      getId: sinon.stub().returns('SPACE_ID'),
      getContentTypes: sinon.stub().defers(),
      getPublishedContentTypes: sinon.stub().defers()
    };
  }

});
