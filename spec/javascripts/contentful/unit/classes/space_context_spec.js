'use strict';

describe('SpaceContext class with no space', function () {
  var spaceContext;
  beforeEach(function () {
    module('contentful/test');
    inject(function (SpaceContext) {
      spaceContext = new SpaceContext();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));


  it('has no space', function () {
    expect(spaceContext.space).toBeUndefined();
  });

  it('gets the locales in a default state', function () {
    expect(_.isArray(spaceContext.publishLocales)).toBeTruthy();
    expect(spaceContext.publishLocales.length).toBe(0);
    expect(spaceContext.defaultLocale).toBeNull();
  });

  it('has no active locales', function () {
    expect(spaceContext.activeLocales.length).toBe(0);
  });

  it('has no content types', function () {
    spaceContext.refreshContentTypes();
    expect(spaceContext.contentTypes.length).toEqual(0);
    expect(spaceContext.publishedContentTypes.length).toEqual(0);
  });

});

describe('SpaceContext class with a space', function () {
  var spaceContext;
  beforeEach(function () {
    module('contentful/test');
    inject(function (SpaceContext) {
      spaceContext = new SpaceContext(window.createMockSpace());
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));


  it('has a space', function () {
    expect(spaceContext.space).toBeDefined();
  });

  it('gets the locales refreshed', function () {
    expect(_.isArray(spaceContext.publishLocales)).toBeTruthy();
    expect(spaceContext.publishLocales[0].code).toBeDefined();
    expect(spaceContext.defaultLocale).toBeDefined();
    expect(spaceContext.defaultLocale.code).toBeDefined();
  });

  it('has active locales', function () {
    expect(spaceContext.localeStates['en-US']).toBeTruthy();
    expect(_.isArray(spaceContext.activeLocales)).toBeTruthy();
    expect(spaceContext.activeLocales[0].code).toBeDefined();
  });

  it('gets a publish locale', function () {
    expect(spaceContext.getPublishLocale('en-US')).toEqual({name: 'en-US', code: 'en-US'});
  });

  describe('getting content types from server', function () {
    var getContentTypesStub, getPublishedContentTypesStub;
    var contentType1, contentType2;
    beforeEach(function () {
      contentType1 = window.createMockEntity('contentType1');
      contentType1.isDeleted = sinon.stub().returns(false);
      contentType2 = window.createMockEntity('contentType2');
      contentType2.isDeleted = sinon.stub().returns(false);
      getContentTypesStub = sinon.stub();
      getContentTypesStub.callsArgWithAsync(1, null, [
        contentType2,
        contentType1
      ]);
      spaceContext.space.getContentTypes = getContentTypesStub;
      getPublishedContentTypesStub = sinon.stub();
      getPublishedContentTypesStub.callsArgWithAsync(0, null, [
        contentType1,
        contentType2
      ]);
      spaceContext.space.getPublishedContentTypes = getPublishedContentTypesStub;
    });

    it('refreshes content types', function () {
      this.async(function (done) {
        var refreshPublishedContentTypesSpy = sinon.spy(spaceContext, 'refreshPublishedContentTypes');

        spaceContext.refreshContentTypes().then(function () {
          expect(spaceContext.contentTypes[0].getName()).toEqual('contentType1');
          expect(refreshPublishedContentTypesSpy.called).toBeTruthy();
          refreshPublishedContentTypesSpy.restore();
          done();
        });
      });
    });

    describe('refreshes published content types', function () {
      it('has content types', function () {
        this.async(function (done) {
          spaceContext.refreshPublishedContentTypes().then(function () {
            expect(spaceContext.publishedContentTypes.length).toBeGreaterThan(0);
            expect(spaceContext.publishedContentTypes[0].getName()).toEqual('contentType1');
            done();
          });
        });
      });

      it('merges context types from client and server together', function () {
        this.async(function (done) {
          spaceContext.publishedContentTypes = [ contentType1 ];
          spaceContext.refreshPublishedContentTypes().then(function () {
            expect(spaceContext.publishedContentTypes.length).toBe(2);
            done();
          });
        });
      });

      it('does not include deleted published content Types', function () {
        getPublishedContentTypesStub = sinon.stub();
        getPublishedContentTypesStub.callsArgWithAsync(0, null, [
          contentType1,
          _.merge(contentType2, {isDeleted: sinon.stub().returns(true)})
        ]);
        this.async(function (done) {
          spaceContext.refreshPublishedContentTypes().then(function () {
            expect(spaceContext.publishedContentTypes.length).toBe(1);
            expect(_.contains(spaceContext.publishedContentTypes, contentType2)).toBe(false);
            done();
          });
        });
      });

      it('registers a published content type', function () {
        var contentType = window.createMockEntity('contentType3');
        spaceContext.registerPublishedContentType(contentType);
        expect(spaceContext.publishedContentTypes[0]).toBe(contentType);
      });

      it('removes a content type', function () {
        this.async(function (done) {
          spaceContext.refreshContentTypes().then(function () {
            spaceContext.removeContentType(contentType1);

            expect(spaceContext.contentTypes[0].getName()).toEqual('contentType2');
            done();
          });
        });
      });

      it('gets a published type for a given entry', function () {
        this.async(function (done) {
          spaceContext.refreshContentTypes().then(function () {
            var entry = window.createMockEntity('entry1', 'contentType1');
            expect(spaceContext.publishedTypeForEntry(entry)).toBe(contentType1);
            done();
          });
        });
      });

      describe('gets an entry title', function () {
        var entry;
        beforeEach(function () {
          entry = window.createMockEntity('entry1', 'contentType1');
        });

        it('fetched successfully', function () {
          this.async(function (done) {
            spaceContext.refreshContentTypes().then(function () {
              expect(spaceContext.entryTitle(entry)).toEqual('the title');
              done();
            });
          });
        });

        it('gets no title, falls back to default', function () {
          this.async(function (done) {
            spaceContext.publishedTypeForEntry = sinon.stub();
            spaceContext.publishedTypeForEntry.returns({
              data: {}
            });
            spaceContext.refreshContentTypes().then(function () {
              expect(spaceContext.entryTitle(entry)).toEqual('Untitled');
              done();
            });
          });
        });

        it('handles an exception, falls back to default', function () {
          this.async(function (done) {
            spaceContext.publishedTypeForEntry = sinon.stub();
            spaceContext.publishedTypeForEntry.returns({});
            spaceContext.refreshContentTypes().then(function () {
              expect(spaceContext.entryTitle(entry)).toEqual('Untitled');
              done();
            });
          });
        });

        it('fetched successfully but title is empty', function () {
          this.async(function (done) {
            entry.data.fields.title = '   ';
            spaceContext.refreshContentTypes().then(function () {
              expect(spaceContext.entryTitle(entry)).toEqual('Untitled');
              done();
            });
          });
        });

        it('fetched successfully but title doesn\'t exist', function () {
          this.async(function (done) {
            delete entry.data.fields.title;
            spaceContext.refreshContentTypes().then(function () {
              expect(spaceContext.entryTitle(entry)).toEqual('Untitled');
              done();
            });
          });
        });

        describe('unregistering a published Content Type', function () {
          beforeEach(function () {
            spaceContext.unregisterPublishedContentType(contentType1);
          });

          it('should not be included in the list anymore', function () {
            expect(_.contains(spaceContext.publishedContentTypes, contentType1)).toBe(false);
          });

          it('should not be found by publishedTypeForEntry anymore', function () {
            var entry = {
              getContentTypeId: sinon.stub().returns('contentType1')
            };
            expect(spaceContext.publishedTypeForEntry(entry)).toBe(undefined);
            expect(_.contains(spaceContext.publishedContentTypes, contentType1)).toBe(false);
          });
        });

      });

      describe('gets an asset title', function () {
        var asset;
        beforeEach(function () {
          asset = window.createMockEntity('entry1', 'contentType1');
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

      });

      describe('gets a localized field', function () {
        var asset;
        beforeEach(function () {
          asset = window.createMockEntity('entry1', 'contentType1');
        });

        it('fetched successfully', function () {
          expect(spaceContext.localizedField(asset, 'data.fields.title')).toEqual('the title');
        });

      });

    });

  });

  describe('getting existing published content types locally', function () {
    var contentType;

    beforeEach(function () {
      spaceContext._publishedContentTypesHash = {
        hashId: 'contentType'
      };
      spaceContext.refreshContentTypes = sinon.stub();
      contentType = spaceContext.getPublishedContentType('hashId');
    });

    it('gets a published content type', function () {
      expect(contentType).toBe('contentType');
    });

    it('does not refresh content types', function () {
      expect(spaceContext.refreshContentTypes.called).toBe(false);
    });

    it('does not set a flag for the content type as being missing', function () {
      expect(spaceContext._publishedContentTypeIsMissing.hashId).toBeUndefined();
    });

    it('gets a published type for a given entry', function () {
      var entry = window.createMockEntity(123, 'hashId', 'Entry');
      expect(spaceContext.publishedTypeForEntry(entry)).toBe('contentType');
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
      expect(spaceContext.refreshContentTypes.called).toBe(true);
    });

    it('sets a flag for the content type as being missing', function () {
      expect(spaceContext._publishedContentTypeIsMissing.hashId).toBeDefined();
    });

    it('gets no published type for a given entry', function () {
      var entry = window.createMockEntity(123, 'hashId', 'Entry');
      expect(spaceContext.publishedTypeForEntry(entry)).toBeUndefined();
    });

  });


});

describe('SpaceContext resolving missing ContentTypes', function () {
  var spaceContext, scope;

  beforeEach(module('contentful/test'));
  beforeEach(inject(function ($rootScope, SpaceContext) {
    scope = $rootScope;
    spaceContext = new SpaceContext(); // Not passing argument to avoid initializing the locales
    spaceContext.space = { };
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('should not trigger a refresh when resolving a known published content type', function () {
    spyOn(spaceContext, 'refreshContentTypes');
    spaceContext._publishedContentTypesHash = {
      foo: 'Bar'
    };
    expect(spaceContext.publishedTypeForEntry({
      getContentTypeId: function () { return 'foo'; }
    })).toBe('Bar');
    expect(spaceContext.refreshContentTypes).not.toHaveBeenCalled();
  });

  it('should trigger a refresh when attempting to resolve an unknown published content type', function () {
    spyOn(spaceContext, 'refreshContentTypes');
    spaceContext.publishedTypeForEntry({
      getContentTypeId: function () { return 'foo'; }
    });
    expect(spaceContext.refreshContentTypes).toHaveBeenCalled();
  });

  it('should mark a published type as not missing after retrieval', function () {
    spaceContext._publishedContentTypeIsMissing['foo'] = true;
    spaceContext.space.getPublishedContentTypes = function (callback) {
      callback(null, [
        {
          getName: function(){return '';},
          getId: function () { return 'foo'; },
          isDeleted: sinon.stub().returns(false),
          data: { sys: {id: 'foo'} }
        }
      ]);
    };
    spaceContext.refreshPublishedContentTypes();
    expect(spaceContext._publishedContentTypeIsMissing['foo']).toBeFalsy();
  });

  it('should not trigger a refresh on content types that are known missing', function () {
    spaceContext._publishedContentTypeIsMissing['foo'] = true;
    spyOn(spaceContext, 'refreshContentTypes');
    spaceContext.publishedTypeForEntry({
      getContentTypeId: function () { return 'foo'; }
    });
    expect(spaceContext.refreshContentTypes).not.toHaveBeenCalled();
  });
});
