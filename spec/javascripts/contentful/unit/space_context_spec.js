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
    expect(spaceContext.localesActive['en-US']).toBeTruthy();
    expect(_.isArray(spaceContext.activeLocales)).toBeTruthy();
    expect(spaceContext.activeLocales[0].code).toBeDefined();
  });

  it('gets a publish locale', function () {
    expect(spaceContext.getPublishLocale('en-US')).toEqual({name: 'en-US', code: 'en-US'});
  });

  describe('gets content types', function () {
    var getContentTypesStub, getPublishedContentTypesStub;
    var contentType1, contentType2;
    beforeEach(function () {
      contentType1 = window.createMockEntity('contentType1');
      contentType2 = window.createMockEntity('contentType2');
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

      it('has content types', function () {
        this.async(function (done) {
          spaceContext.publishedContentTypes = [
            contentType1
          ];
          spaceContext.refreshPublishedContentTypes().then(function () {
            expect(spaceContext.publishedContentTypes.length).toBe(2);
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

    });

  });

});
