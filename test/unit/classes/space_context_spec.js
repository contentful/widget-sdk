'use strict';

describe('spaceContext', function () {

  describe('with no space', function () {
    beforeEach(function () {
      module('contentful/test');
      inject(function (spaceContext) {
        this.spaceContext = spaceContext;
      });
    });

    it('has no space', function () {
      expect(this.spaceContext.space).toBeNull();
    });

    describe('refreshes content types', function () {
      beforeEach(function () {
        this.spaceContext.refreshContentTypes();
      });

      it('but has no content types', function () {
        expect(this.spaceContext.contentTypes.length).toEqual(0);
      });

      it('but has no content types', function () {
        expect(this.spaceContext.publishedContentTypes.length).toEqual(0);
      });
    });

  });

  describe('with a space', function () {
    var space, rootScope, $q;
    var cfStub;
    beforeEach(function () {
      module('contentful/test');
      inject(function (spaceContext, _cfStub_, $rootScope, _$q_) {
        cfStub = _cfStub_;
        space = cfStub.space('test');
        rootScope = $rootScope;
        $q = _$q_;
        this.spaceContext = spaceContext;
        this.spaceContext.resetContextWithSpace(space);
      });
    });

    it('has a space', function () {
      expect(this.spaceContext.space).toBeDefined();
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
        var refreshPublishedContentTypesSpy = sinon.spy(this.spaceContext, 'refreshPublishedContentTypes');

        getContentTypes.returns($q.when(contentTypes.concat().reverse()));
        getPublishedContentTypes.returns($q.when(contentTypes));
        this.spaceContext.refreshContentTypes();
        rootScope.$apply();
        expect(this.spaceContext.contentTypes[0].getName()).toEqual('contentType1');
        sinon.assert.called(refreshPublishedContentTypesSpy);
      });

      it('makes only a single call to the server for quick refreshes', function () {
        this.spaceContext.refreshContentTypes();
        this.spaceContext.refreshContentTypes();
        expect(getContentTypes.callCount).toBe(1);
      });

      it('results in an error message if API broken', function () {
        var handler;
        inject(function (ReloadNotification) {
          handler = ReloadNotification.apiErrorHandler;
        });
        sinon.stub(this.spaceContext._contentTypeLoader, 'loadPromise').returns($q.reject({statusCode: 500}));
        this.spaceContext.refreshContentTypes();
        rootScope.$apply();
        sinon.assert.called(handler);
      });

      describe('refreshes published content types', function () {
        it('makes only a single call to the server for quick refreshes', function () {
          this.spaceContext.refreshPublishedContentTypes();
          this.spaceContext.refreshPublishedContentTypes();
          expect(getPublishedContentTypes.callCount).toBe(1);
        });

        it('has content types', function () {
          getPublishedContentTypes.returns($q.when(contentTypes));
          this.spaceContext.refreshPublishedContentTypes();
          rootScope.$apply();
          expect(this.spaceContext.publishedContentTypes.length).toBeGreaterThan(0);
          expect(this.spaceContext.publishedContentTypes[0].getName()).toEqual('contentType1');
        });

        it('merges context types from client and server together', function () {
          this.spaceContext.publishedContentTypes = [ contentTypes[0] ];
          getPublishedContentTypes.returns($q.when(contentTypes));
          this.spaceContext.refreshPublishedContentTypes();
          rootScope.$apply();
          expect(this.spaceContext.publishedContentTypes.length).toBe(2);
        });

        it('does not include deleted published content Types', function () {
          sinon.stub(contentTypes[1], 'isDeleted').returns(true);
          getPublishedContentTypes.returns($q.when(contentTypes));
          this.spaceContext.refreshPublishedContentTypes();
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
      module('contentful/test');
      var cfStub = this.$inject('cfStub');
      var space = cfStub.space('test');
      scope = this.$inject('$rootScope');
      $q = this.$inject('$q');
      this.spaceContext = this.$inject('spaceContext');
      this.spaceContext.resetContextWithSpace(space);
      entry = { getContentTypeId: function () { return 'foo'; } };
      spyOn(this.spaceContext, 'refreshContentTypes');
    });

    it('should not trigger a refresh when resolving a known published content type', function () {
      this.spaceContext._publishedContentTypesHash = { foo: 'Bar' };

      expect(this.spaceContext.publishedTypeForEntry(entry)).toBe('Bar');
      expect(this.spaceContext.refreshContentTypes).not.toHaveBeenCalled();
    });

    it('should trigger a refresh when attempting to resolve an unknown published content type', function () {
      this.spaceContext.publishedTypeForEntry(entry);
      expect(this.spaceContext.refreshContentTypes).toHaveBeenCalled();
    });

    it('should mark a published type as not missing after retrieval', function () {
      this.spaceContext._publishedContentTypeIsMissing['foo'] = true;
      this.spaceContext.space.getPublishedContentTypes = sinon.stub().returns($q.when([
        {
          getName: function(){return '';},
          getId: function () { return 'foo'; },
          isDeleted: sinon.stub().returns(false),
          data: { sys: {id: 'foo'} }
        }
      ]));
      this.spaceContext.refreshPublishedContentTypes();
      scope.$apply();
      expect(this.spaceContext._publishedContentTypeIsMissing['foo']).toBeFalsy();
    });

    it('should not trigger a refresh on content types that are known missing', function () {
      this.spaceContext._publishedContentTypeIsMissing['foo'] = true;
      this.spaceContext.publishedTypeForEntry(entry);
      expect(this.spaceContext.refreshContentTypes).not.toHaveBeenCalled();
    });

    it('should not trigger a refresh for content types if called twice in quick succession', function () {
      sinon.stub(this.spaceContext, 'refreshContentTypes');
      this.spaceContext.getPublishedContentType('contentTypeId');
      expect(this.spaceContext.refreshContentTypes.callCount).toBe(1);
      this.spaceContext.getPublishedContentType('contentTypeId');
      expect(this.spaceContext.refreshContentTypes.callCount).toBe(1);
    });
  });

});
