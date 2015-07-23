'use strict';

describe('SpaceContext class with no space', function () {
  var spaceContext;
  beforeEach(function () {
    module('contentful/test');
    inject(function (SpaceContext) {
      spaceContext = new SpaceContext();
    });
  });

  it('has no space', function () {
    expect(spaceContext.space).toBeUndefined();
  });

  it('privateLocales exists', function () {
    expect(_.isArray(spaceContext.privateLocales)).toBeTruthy();
  });

  it('private locales is empty', function () {
    expect(spaceContext.privateLocales.length).toBe(0);
  });

  it('no default locale is defined', function () {
    expect(spaceContext.defaultLocale).toBeNull();
  });

  it('has no active locales', function () {
    expect(spaceContext.activeLocales.length).toBe(0);
  });

  describe('refreshes locales', function () {
    beforeEach(function () {
      spaceContext.refreshActiveLocales = sinon.stub();
      spaceContext.refreshLocales();
    });

    it('privateLocales exists', function () {
      expect(_.isArray(spaceContext.privateLocales)).toBeTruthy();
    });

    it('private locales is empty', function () {
      expect(spaceContext.privateLocales.length).toBe(0);
    });

    it('no default locale is defined', function () {
      expect(spaceContext.defaultLocale).toBeNull();
    });

    it('refreshes active locales', function () {
      sinon.assert.called(spaceContext.refreshActiveLocales);
    });
  });

  describe('refreshes content types', function () {
    beforeEach(function () {
      spaceContext.refreshContentTypes();
    });

    it('but has no content types', function () {
      expect(spaceContext.contentTypes.length).toEqual(0);
    });

    it('but has no content types', function () {
      expect(spaceContext.publishedContentTypes.length).toEqual(0);
    });
  });

});

describe('SpaceContext class with a space', function () {
  var space, spaceContext, rootScope, $q;
  var cfStub;
  beforeEach(function () {
    module('contentful/test');
    inject(function (SpaceContext, _cfStub_, $rootScope, _$q_) {
      cfStub = _cfStub_;
      space = cfStub.space('test');
      rootScope = $rootScope;
      $q = _$q_;
      spaceContext = new SpaceContext(space);
    });
  });

  it('has a space', function () {
    expect(spaceContext.space).toBeDefined();
  });

  it('gets an array of published locales', function () {
    expect(_.isArray(spaceContext.privateLocales)).toBeTruthy();
  });

  it('has a published locale with a code', function () {
    expect(spaceContext.privateLocales[0].code).toBeDefined();
  });

  it('has a default locale', function () {
    expect(spaceContext.defaultLocale).toBeDefined();
  });

  it('has a default locale with a code', function () {
    expect(spaceContext.defaultLocale.code).toBeDefined();
  });

  it('sets a locale state for an active locale', function () {
    expect(spaceContext.localeStates['en-US']).toBeTruthy();
  });

  it('has active locales', function () {
    expect(_.isArray(spaceContext.activeLocales)).toBeTruthy();
  });

  it('has an active locale with a code', function () {
    expect(spaceContext.activeLocales[0].code).toBeDefined();
  });

  describe('refreshes locales', function () {
    var privateLocales, defaultLocale;
    beforeEach(function () {
      privateLocales = ['privateLocales'];
      defaultLocale = {
        code: 'en-US',
        internal_code: 'en-US'
      };
      spaceContext.space.getPrivateLocales = sinon.stub().returns(privateLocales);
      spaceContext.space.getDefaultLocale  = sinon.stub().returns(defaultLocale);
      spaceContext.refreshActiveLocales = sinon.stub();
      spaceContext.refreshLocales();
    });

    it('calls private locales space getter', function () {
      sinon.assert.called(spaceContext.space.getPrivateLocales);
    });

    it('privateLocales exists', function () {
      expect(_.isArray(spaceContext.privateLocales)).toBeTruthy();
    });

    it('private locales is the supplied array', function () {
      expect(spaceContext.privateLocales).toBe(privateLocales);
    });

    it('calls default locale space getter', function () {
      sinon.assert.called(spaceContext.space.getDefaultLocale);
    });

    it('default locale is defined', function () {
      expect(spaceContext.defaultLocale).toBe(defaultLocale);
    });

    it('refreshes active locales', function () {
      sinon.assert.called(spaceContext.refreshActiveLocales);
    });

    it('sets locale state for default locale', function () {
      expect(spaceContext.localeStates['en-US']).toBeTruthy();
    });
  });

  describe('refresh active locales', function () {
    beforeEach(function () {
      spaceContext.privateLocales = [
        {
          code: 'en-US',
          internal_code: 'en-US'
        },
        {
          code: 'pt-PT',
          internal_code: 'pt-PT'
        },
        {
          code: 'pt-BR',
          internal_code: 'pt-BR'
        }
      ];
      spaceContext.localeStates = {
        'en-US': true,
        'pt-PT': true,
        'pt-BR': false
      };
      spaceContext.refreshActiveLocales();
    });

    it('sets new locale states', function () {
      expect(spaceContext.localeStates).toEqual({
        'en-US': true,
        'pt-PT': true
      });
    });

    it('sets new active locales', function () {
      expect(spaceContext.activeLocales).toEqual([
        {
          code: 'en-US',
          internal_code: 'en-US'
        },
        {
          code: 'pt-PT',
          internal_code: 'pt-PT'
        }
      ]);
    });
  });

  describe('gets a private locale and', function () {
    var privateLocale;
    beforeEach(function () {
      privateLocale = spaceContext.getPrivateLocale('en-US');
    });

    it('it exists', function () {
      expect(privateLocale).toBeDefined();
    });

    it('has a name', function () {
      expect(privateLocale.name).toEqual('en-US');
    });

    it('has a code', function () {
      expect(privateLocale.code).toEqual('en-US');
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
      spaceContext.space.getContentTypes = getContentTypes = sinon.stub().returns($q.defer().promise);
      spaceContext.space.getPublishedContentTypes = getPublishedContentTypes = sinon.stub().returns($q.defer().promise);
    });

    it('refreshes content types', function () {
      var refreshPublishedContentTypesSpy = sinon.spy(spaceContext, 'refreshPublishedContentTypes');

      getContentTypes.returns($q.when(contentTypes.concat().reverse()));
      getPublishedContentTypes.returns($q.when(contentTypes));
      spaceContext.refreshContentTypes();
      rootScope.$apply();
      expect(spaceContext.contentTypes[0].getName()).toEqual('contentType1');
      sinon.assert.called(refreshPublishedContentTypesSpy);
    });

    it('makes only a single call to the server for quick refreshes', function () {
      spaceContext.refreshContentTypes();
      spaceContext.refreshContentTypes();
      expect(getContentTypes.callCount).toBe(1);
    });

    it('results in an error message if API broken', function () {
      var handler;
      inject(function (ReloadNotification) {
        handler = ReloadNotification.apiErrorHandler;
      });
      sinon.stub(spaceContext._contentTypeLoader, 'loadPromise').returns($q.reject({statusCode: 500}));
      spaceContext.refreshContentTypes();
      rootScope.$apply();
      sinon.assert.called(handler);
    });

    describe('refreshes published content types', function () {
      it('makes only a single call to the server for quick refreshes', function () {
        spaceContext.refreshPublishedContentTypes();
        spaceContext.refreshPublishedContentTypes();
        expect(getPublishedContentTypes.callCount).toBe(1);
      });

      it('has content types', function () {
        getPublishedContentTypes.returns($q.when(contentTypes));
        spaceContext.refreshPublishedContentTypes();
        rootScope.$apply();
        expect(spaceContext.publishedContentTypes.length).toBeGreaterThan(0);
        expect(spaceContext.publishedContentTypes[0].getName()).toEqual('contentType1');
      });

      it('merges context types from client and server together', function () {
        spaceContext.publishedContentTypes = [ contentTypes[0] ];
        getPublishedContentTypes.returns($q.when(contentTypes));
        spaceContext.refreshPublishedContentTypes();
        rootScope.$apply();
        expect(spaceContext.publishedContentTypes.length).toBe(2);
      });

      it('does not include deleted published content Types', function () {
        sinon.stub(contentTypes[1], 'isDeleted').returns(true);
        getPublishedContentTypes.returns($q.when(contentTypes));
        spaceContext.refreshPublishedContentTypes();
        rootScope.$apply();
        expect(spaceContext.publishedContentTypes.length).toBe(1);
        expect(_.contains(spaceContext.publishedContentTypes, contentTypes[1])).toBe(false);
      });

      it('registers a published content type', function () {
        var contentType = cfStub.contentType(space, 'content_type3', 'contentType3');
        spaceContext.registerPublishedContentType(contentType);
        expect(spaceContext.publishedContentTypes[0]).toBe(contentType);
      });

      it('removes a content type', function () {
        // TODO test this without refresh calls
        getContentTypes.returns($q.when(contentTypes));
        spaceContext.refreshContentTypes();
        rootScope.$apply();
        spaceContext.removeContentType(contentTypes[0]);
        expect(spaceContext.contentTypes[0].getName()).toEqual('contentType2');
      });

      it('gets a published type for a given entry', function () {
        // TODO test this without refresh calls
        getContentTypes.returns($q.when(contentTypes));
        getPublishedContentTypes.returns($q.when(contentTypes));
        spaceContext.refreshContentTypes();
        rootScope.$apply();
        var entry = cfStub.entry(space, 'entry2', 'content_type1');
        expect(spaceContext.publishedTypeForEntry(entry)).toBe(contentTypes[0]);
      });

      describe('gets an entry title', function () {
        var entry;
        beforeEach(function () {
          entry = cfStub.entry(space, 'entry1',
                               'content_type1',
                               { title: { 'en-US': 'the title' } });
          getContentTypes.returns($q.when(contentTypes.concat().reverse()));
          getPublishedContentTypes.returns($q.when(contentTypes.concat().reverse()));
          spaceContext.refreshContentTypes();
          rootScope.$apply();
        });

        it('fetched successfully', function () {
          expect(spaceContext.entryTitle(entry)).toEqual('the title');
        });

        it('gets no title, falls back to default', function () {
          sinon.stub(spaceContext, 'publishedTypeForEntry').returns({
            data: {}
          });
          expect(spaceContext.entryTitle(entry)).toEqual('Untitled');
        });

        it('handles an exception, falls back to default', function () {
          sinon.stub(spaceContext, 'publishedTypeForEntry').returns({});
          expect(spaceContext.entryTitle(entry)).toEqual('Untitled');
        });

        it('fetched successfully but title is empty', function () {
          entry.data.fields.title = '   ';
          expect(spaceContext.entryTitle(entry)).toEqual('Untitled');
        });

        it('fetched title successfully but title is empty (modelValue)', function () {
          entry.data.fields.title = '     ';
          expect(spaceContext.entryTitle(entry, undefined, true)).toEqual(null);
        });

        it('fetched successfully but title doesn\'t exist', function () {
          delete entry.data.fields.title;
          expect(spaceContext.entryTitle(entry)).toEqual('Untitled');
        });

        it('fetched title successfully but title doesn\'t exist (modelValue)', function () {
          delete entry.data.fields.title;
          expect(spaceContext.entryTitle(entry, undefined, true)).toEqual(null);
        });

        describe('unregistering a published Content Type', function () {
          beforeEach(function () {
            spaceContext.unregisterPublishedContentType(contentTypes[0]);
          });

          it('should not be included in the list anymore', function () {
            expect(spaceContext.publishedContentTypes).not.toContain(contentTypes[0]);
          });

          it('should not be found by publishedTypeForEntry anymore', function () {
            var entry = {
              getContentTypeId: sinon.stub().returns('contentType1')
            };
            expect(spaceContext.publishedTypeForEntry(entry)).toBe(undefined);
            expect(spaceContext.publishedContentTypes).not.toContain(contentTypes[0]);
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
          expect(spaceContext.assetTitle(asset)).toEqual('the title');
        });

        it('gets no title, falls back to default', function () {
          asset.data = {fields: {}};
          expect(spaceContext.assetTitle(asset)).toEqual('Untitled');
        });

        it('handles an exception, falls back to default', function () {
          asset.data = {};
          expect(spaceContext.assetTitle(asset)).toEqual('Untitled');
        });

        it('fetched successfully but title is empty', function () {
          asset.data.fields.title = '   ';
          expect(spaceContext.assetTitle(asset)).toEqual('Untitled');
        });

        it('fetched successfully but title doesn\'t exist', function () {
          delete asset.data.fields.title;
          expect(spaceContext.assetTitle(asset)).toEqual('Untitled');
        });

        it('gets a localized field', function () {
          expect(spaceContext.localizedField(asset, 'data.fields.title')).toEqual('the title');
        });
      });

    });

  });

  describe('getting existing published content types locally', function () {
    var contentType;

    beforeEach(function () {
      spaceContext._publishedContentTypesHash = {
        hashId: 'contentType1'
      };
      spaceContext.refreshContentTypes = sinon.stub();
      contentType = spaceContext.getPublishedContentType('hashId');
    });

    it('gets a published content type', function () {
      expect(contentType).toBe('contentType1');
    });

    it('does not refresh content types', function () {
      sinon.assert.notCalled(spaceContext.refreshContentTypes);
    });

    it('does not set a flag for the content type as being missing', function () {
      expect(spaceContext._publishedContentTypeIsMissing.hashId).toBeUndefined();
    });

    it('gets a published type for a given entry', function () {
      var entry = cfStub.entry(space, 'entry1', 'hashId');
      expect(spaceContext.publishedTypeForEntry(entry)).toBe('contentType1');
    });

  });

  describe('getting missing published content types locally', function () {
    var contentType;

    beforeEach(function () {
      spaceContext._publishedContentTypesHash = {};
      spaceContext.refreshContentTypes = sinon.stub();
      contentType = spaceContext.getPublishedContentType('hashId');
    });

    it('gets a published content type', function () {
      expect(contentType).toBeUndefined();
    });

    it('refreshes content types', function () {
      sinon.assert.called(spaceContext.refreshContentTypes);
    });

    it('sets a flag for the content type as being missing', function () {
      expect(spaceContext._publishedContentTypeIsMissing.hashId).toBeDefined();
    });

    it('gets no published type for a given entry', function () {
      var entry = cfStub.entry(space, 'entry1', 'hashId');
      expect(spaceContext.publishedTypeForEntry(entry)).toBeUndefined();
    });

  });

  describe('getting display field for a given type', function() {
    beforeEach(function() {
      spaceContext.getPublishedContentType = sinon.stub();
    });

    it('returns the field', function() {
      var field = {id: 'name'};
      spaceContext.getPublishedContentType.returns({
        data: {
          displayField: 'name',
          fields: [field]
        }
      });
      expect(spaceContext.displayFieldForType('type')).toBe(field);
    });

    it('returns nothing', function() {
      var field = {id: 'name'};
      spaceContext.getPublishedContentType.returns({
        data: {
          displayField: 'othername',
          fields: [field]
        }
      });
      expect(spaceContext.displayFieldForType('type')).toBeUndefined();
    });

  });
});


describe('SpaceContext resolving missing ContentTypes', function () {
  var spaceContext, scope, entry, $q;

  beforeEach(module('contentful/test'));
  beforeEach(inject(function ($rootScope, SpaceContext, _$q_) {
    $q = _$q_;
    scope = $rootScope;
    spaceContext = new SpaceContext(); // Not passing argument to avoid initializing the locales
    spaceContext.space = {};
    entry = { getContentTypeId: function () { return 'foo'; } };
    spyOn(spaceContext, 'refreshContentTypes');
  }));

  it('should not trigger a refresh when resolving a known published content type', function () {
    spaceContext._publishedContentTypesHash = { foo: 'Bar' };

    expect(spaceContext.publishedTypeForEntry(entry)).toBe('Bar');
    expect(spaceContext.refreshContentTypes).not.toHaveBeenCalled();
  });

  it('should trigger a refresh when attempting to resolve an unknown published content type', function () {
    spaceContext.publishedTypeForEntry(entry);
    expect(spaceContext.refreshContentTypes).toHaveBeenCalled();
  });

  it('should mark a published type as not missing after retrieval', function () {
    spaceContext._publishedContentTypeIsMissing['foo'] = true;
    spaceContext.space.getPublishedContentTypes = sinon.stub().returns($q.when([
      {
        getName: function(){return '';},
        getId: function () { return 'foo'; },
        isDeleted: sinon.stub().returns(false),
        data: { sys: {id: 'foo'} }
      }
    ]));
    spaceContext.refreshPublishedContentTypes();
    scope.$apply();
    expect(spaceContext._publishedContentTypeIsMissing['foo']).toBeFalsy();
  });

  it('should not trigger a refresh on content types that are known missing', function () {
    spaceContext._publishedContentTypeIsMissing['foo'] = true;
    spaceContext.publishedTypeForEntry(entry);
    expect(spaceContext.refreshContentTypes).not.toHaveBeenCalled();
  });

  it('should not trigger a refresh for content types if called twice in quick succession', function () {
    sinon.stub(spaceContext, 'refreshContentTypes');
    spaceContext.getPublishedContentType('contentTypeId');
    expect(spaceContext.refreshContentTypes.callCount).toBe(1);
    spaceContext.getPublishedContentType('contentTypeId');
    expect(spaceContext.refreshContentTypes.callCount).toBe(1);
  });
});
