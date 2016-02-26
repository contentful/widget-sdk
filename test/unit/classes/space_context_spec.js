'use strict';

describe('spaceContext', function () {

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('data/userCache', sinon.stub());
      $provide.value('data/editingInterfaces', sinon.stub());
    });
    this.spaceContext = this.$inject('spaceContext');
    this.theLocaleStore = this.$inject('TheLocaleStore');
    this.theLocaleStore.resetWithSpace = sinon.stub();
  });

  describe('#resetWithSpace()', function () {
    var SPACE, result, Widgets;

    beforeEach(function () {
      var createEditingInterfaces = this.$inject('data/editingInterfaces');
      createEditingInterfaces.returns('EI');

      Widgets = this.$inject('widgets');
      Widgets.setSpace = sinon.stub().defers();

      SPACE = {
        endpoint: sinon.stub().returns({
          get: sinon.stub().rejects()
        }),
        getId: sinon.stub().returns('SPACE_ID')
      };
      sinon.stub(this.spaceContext, 'refreshContentTypes');
      this.spaceContext.contentTypes = [{}];
      result = this.spaceContext.resetWithSpace(SPACE);
    });

    it('sets space on context', function () {
      expect(this.spaceContext.space).toBe(SPACE);
    });

    it('clears content types', function () {
      expect(this.spaceContext.contentTypes.length).toEqual(0);
    });

    it('refreshes content types', function () {
      sinon.assert.called(this.spaceContext.refreshContentTypes);
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
      result.then(done);
      this.$apply();
      sinon.assert.notCalled(done);

      Widgets.setSpace.resolve();
      this.$apply();
      sinon.assert.called(done);
    });

    it('sets #editingInterfaces', function () {
      var createEditingInterfaces = this.$inject('data/editingInterfaces');
      sinon.assert.calledOnce(createEditingInterfaces);
      expect(this.spaceContext.editingInterfaces).toEqual('EI');
    });
  });

  describe('with a space', function () {
    var space, rootScope, $q;
    var cfStub;
    beforeEach(function () {
      cfStub = this.$inject('cfStub');
      space = cfStub.space('test');
      rootScope = this.$inject('$rootScope');
      $q = this.$inject('$q');

      // do not refresh  CTs while initializing with space
      sinon.stub(this.spaceContext, 'refreshContentTypes');
      this.spaceContext.resetWithSpace(space);
      this.spaceContext.refreshContentTypes.restore();
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

      it ('returns value if a path is correct', function () {
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
        this.spaceContext.space.getContentTypes = getContentTypes = sinon.stub().returns($q.defer().promise);
        this.spaceContext.space.getPublishedContentTypes = getPublishedContentTypes = sinon.stub().returns($q.defer().promise);
      });

      it('refreshes content types', function () {
        getContentTypes.returns($q.when(contentTypes.concat().reverse()));
        getPublishedContentTypes.returns($q.when(contentTypes));
        this.spaceContext.refreshContentTypes();
        rootScope.$apply();
        expect(this.spaceContext.contentTypes[0].getName()).toEqual('contentType1');
        sinon.assert.called(getPublishedContentTypes);
      });

      it('makes only a single call to the server for quick refreshes', function () {
        var p1 = this.spaceContext.refreshContentTypes();
        var p2 = this.spaceContext.refreshContentTypes();
        rootScope.$apply();
        expect(getContentTypes.callCount).toBe(1);
        expect(p1 === p2).toBe(true);
      });

      it('results in an error message if API broken', function () {
        var handler;
        inject(function (ReloadNotification) {
          handler = ReloadNotification.apiErrorHandler;
        });
        getContentTypes.returns($q.reject({statusCode: 500}));
        this.spaceContext.refreshContentTypes();
        rootScope.$apply();
        sinon.assert.called(handler);
      });

      describe('refreshes published content types', function () {
        it('has content types', function () {
          getContentTypes.returns($q.when(contentTypes));
          getPublishedContentTypes.returns($q.when(contentTypes));
          this.spaceContext.refreshContentTypes();
          rootScope.$apply();
          expect(this.spaceContext.publishedContentTypes.length).toBeGreaterThan(0);
          expect(this.spaceContext.publishedContentTypes[0].getName()).toEqual('contentType1');
        });

        it('merges context types from client and server together', function () {
          this.spaceContext.publishedContentTypes = [ contentTypes[0] ];
          getContentTypes.returns($q.when(contentTypes));
          getPublishedContentTypes.returns($q.when(contentTypes));
          this.spaceContext.refreshContentTypes();
          rootScope.$apply();
          expect(this.spaceContext.publishedContentTypes.length).toBe(2);
        });

        it('does not include deleted published content Types', function () {
          sinon.stub(contentTypes[1], 'isDeleted').returns(true);
          getContentTypes.returns($q.when(contentTypes));
          getPublishedContentTypes.returns($q.when(contentTypes));
          this.spaceContext.refreshContentTypes();
          rootScope.$apply();
          expect(this.spaceContext.publishedContentTypes.length).toBe(1);
          expect(_.contains(this.spaceContext.publishedContentTypes, contentTypes[1])).toBe(false);
        });

        it('registers a published content type', function () {
          var contentType = cfStub.contentType(space, 'content_type3', 'contentType3');
          this.spaceContext.registerPublishedContentType(contentType);
          expect(this.spaceContext.publishedContentTypes[0]).toBe(contentType);
        });

        it('removes a content type', function () {
          // TODO test this without refresh calls
          getContentTypes.returns($q.when(contentTypes));
          this.spaceContext.refreshContentTypes();
          rootScope.$apply();
          this.spaceContext.removeContentType(contentTypes[0]);
          expect(this.spaceContext.contentTypes[0].getName()).toEqual('contentType2');
        });

        it('gets a published type for a given entry', function () {
          // TODO test this without refresh calls
          getContentTypes.returns($q.when(contentTypes));
          getPublishedContentTypes.returns($q.when(contentTypes));
          this.spaceContext.refreshContentTypes();
          rootScope.$apply();
          var entry = cfStub.entry(space, 'entry2', 'content_type1');
          expect(this.spaceContext.publishedTypeForEntry(entry)).toBe(contentTypes[0]);
        });

        describe('gets an entry title', function () {
          var entry;
          beforeEach(function () {
            entry = cfStub.entry(space, 'entry1',
                                 'content_type1',
                                 { title: { 'en-US': 'the title' } });
            getContentTypes.returns($q.when(contentTypes.concat().reverse()));
            getPublishedContentTypes.returns($q.when(contentTypes.concat().reverse()));
            this.spaceContext.refreshContentTypes();
            rootScope.$apply();
          });

          it('fetched successfully', function () {
            expect(this.spaceContext.entryTitle(entry)).toEqual('the title');
          });

          it('gets no title, falls back to default', function () {
            sinon.stub(this.spaceContext, 'publishedTypeForEntry').returns({
              data: {}
            });
            expect(this.spaceContext.entryTitle(entry)).toEqual('Untitled');
          });

          it('handles an exception, falls back to default', function () {
            sinon.stub(this.spaceContext, 'publishedTypeForEntry').returns({});
            expect(this.spaceContext.entryTitle(entry)).toEqual('Untitled');
          });

          it('fetched successfully but title is empty', function () {
            entry.data.fields.title = '   ';
            expect(this.spaceContext.entryTitle(entry)).toEqual('Untitled');
          });

          it('fetched title successfully but title is empty (modelValue)', function () {
            entry.data.fields.title = '     ';
            expect(this.spaceContext.entryTitle(entry, undefined, true)).toEqual(null);
          });

          it('fetched successfully but title doesn\'t exist', function () {
            delete entry.data.fields.title;
            expect(this.spaceContext.entryTitle(entry)).toEqual('Untitled');
          });

          it('fetched title successfully but title doesn\'t exist (modelValue)', function () {
            delete entry.data.fields.title;
            expect(this.spaceContext.entryTitle(entry, undefined, true)).toEqual(null);
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
            expect(this.spaceContext.assetTitle(asset)).toEqual('the title');
          });

          it('gets no title, falls back to default', function () {
            asset.data = {fields: {}};
            expect(this.spaceContext.assetTitle(asset)).toEqual('Untitled');
          });

          it('handles an exception, falls back to default', function () {
            asset.data = {};
            expect(this.spaceContext.assetTitle(asset)).toEqual('Untitled');
          });

          it('fetched successfully but title is empty', function () {
            asset.data.fields.title = '   ';
            expect(this.spaceContext.assetTitle(asset)).toEqual('Untitled');
          });

          it('fetched successfully but title doesn\'t exist', function () {
            delete asset.data.fields.title;
            expect(this.spaceContext.assetTitle(asset)).toEqual('Untitled');
          });

          it('gets a localized field', function () {
            expect(this.spaceContext.localizedField(asset, 'data.fields.title')).toEqual('the title');
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
          return $q.when(ct);
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

    describe('getting display field for a given type', function() {
      beforeEach(function() {
        this.spaceContext.getPublishedContentType = sinon.stub();
      });

      it('returns the field', function() {
        var field = {id: 'name'};
        this.spaceContext.getPublishedContentType.returns({
          data: {
            displayField: 'name',
            fields: [field]
          }
        });
        expect(this.spaceContext.displayFieldForType('type')).toBe(field);
      });

      it('returns nothing', function() {
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


  describe('resolving missing ContentTypes', function () {
    var scope, entry, $q;

    beforeEach(function () {
      var cfStub = this.$inject('cfStub');
      var space = cfStub.space('test');
      scope = this.$inject('$rootScope');
      $q = this.$inject('$q');
      sinon.stub(this.spaceContext, 'refreshContentTypes');
      this.spaceContext.resetWithSpace(space);
      this.spaceContext.refreshContentTypes.restore();
      entry = { getContentTypeId: function () { return 'foo'; } };
      sinon.spy(this.spaceContext, 'refreshContentTypes');
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
      var ctsPromise = $q.when([{
        getName: function(){return '';},
        getId: function () { return 'foo'; },
        isDeleted: sinon.stub().returns(false),
        data: { sys: {id: 'foo'} }
      }]);
      this.spaceContext.space.getContentTypes = sinon.stub().returns(ctsPromise);
      this.spaceContext.space.getPublishedContentTypes = sinon.stub().returns(ctsPromise);
      this.spaceContext.refreshContentTypes();
      scope.$apply();
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

  describe('#entityDescription()', function () {

    it('returns value of first text field', function () {
      var ct = {
        data: {
          fields: [
            {type: 'Text', id: 'DESC'}
          ]
        }
      };
      this.spaceContext.publishedTypeForEntry = sinon.stub().returns(ct);

      var entry = {
        data: {
          fields: {
            'DESC': {en: 'VAL'}
          }
        }
      };
      var desc = this.spaceContext.entityDescription(entry);
      expect(desc).toEqual('VAL');
    });

    it('skips display field', function () {
      var ct = {
        data: {
          displayField: 'DESC',
          fields: [
            {type: 'Text', id: 'DESC'}
          ]
        }
      };
      this.spaceContext.publishedTypeForEntry = sinon.stub().returns(ct);

      var desc = this.spaceContext.entityDescription({});
      expect(desc).toEqual(undefined);
    });

    it('returns undefined if content type is not available', function () {
      this.spaceContext.publishedTypeForEntry = sinon.stub().returns(null);
      var desc = this.spaceContext.entityDescription({});
      expect(desc).toEqual(undefined);
    });

  });

});
