'use strict';

describe('Kaltura Editor Controller Mixin', function() {
  var KalturaEditorControllerMixin, kalturaClientWrapperMock, kalturaLoader, kalturaLoaderDeferred,
      kalturaSearchMock, kalturaSearchInstanceMock, $rootScope;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      kalturaClientWrapperMock = jasmine.createSpyObj('kalturaClientWrapperMock', ['entry']);
      kalturaSearchMock        = jasmine.createSpy('kalturaSearchMock');
      kalturaLoader            = jasmine.createSpyObj('kalturaLoaderSpy', ['load']);

      $provide.value('kalturaLoader', kalturaLoader);
      $provide.value('KalturaSearch', kalturaSearchMock);
      $provide.value('kalturaClientWrapper', kalturaClientWrapperMock);
    });

    inject(function($injector, $q){
      kalturaLoaderDeferred = $q.defer();
      kalturaLoader.load.and.returnValue(kalturaLoaderDeferred.promise);

      $rootScope                   = $injector.get('$rootScope');
      KalturaEditorControllerMixin = $injector.get('KalturaEditorControllerMixin');
    });

    kalturaSearchInstanceMock = jasmine.createSpyObj('kalturaSearchInstanceMock', ['where', 'limit']);
    kalturaSearchInstanceMock.where.and.returnValue(kalturaSearchInstanceMock);
    kalturaSearchMock.and.returnValue(kalturaSearchInstanceMock);
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('loads the kaltura framework', function() {
    expect(kalturaLoader.load).toHaveBeenCalled();
  });

  describe('before the kaltura framework has been loaded', function() {
    describe('#isWidgetReady', function() {
      it('returns false', function() {
        expect(KalturaEditorControllerMixin.isWidgetReady()).toBeFalsy();
      });
    });
  });

  describe('when the kaltura framework has been loaded', function() {
    beforeEach(function() {
      kalturaLoaderDeferred.resolve();
      $rootScope.$apply();
    });

    describe('#customAttrsForPlayer', function() {
      it('returns the passed object', function() {
        expect(KalturaEditorControllerMixin.customAttrsForPlayer('object')).toEqual('object');
      });
    });

    describe('#customAttrsForPlayerInSearchDialog', function() {
      describe('it returns an object', function() {
        var attrs;
        beforeEach(function() {
          attrs = KalturaEditorControllerMixin.customAttrsForPlayerInSearchDialog({id: 'entryId-1'});
        });

        it('has the property "entryId" with the value of the "id" property in the passed object', function() {
          expect(attrs.entryId).toEqual('entryId-1');
        });
      });
    });

    describe('#isWidgetReady', function() {
      it('returns true', function() {
        expect(KalturaEditorControllerMixin.isWidgetReady()).toBeTruthy();
      });
    });

    describe('#loadingFeedbackMessage', function() {
      var message;
      beforeEach(function() {
        message = KalturaEditorControllerMixin.loadingFeedbackMessage({entryId: 'entry-1'});
      });

      it('returns a string with a feedback message for the player of the give entry', function() {
        expect(message).toEqual('Loading player for entry entry-1');
      });
    });

    describe('#processLookupInProviderResult', function() {
      describe('it returns an object', function() {
        var entry;
        beforeEach(function() {
          entry = KalturaEditorControllerMixin.processLookupInProviderResult({assetId: 'entry-1'});
        });

        it('has the property "entryId" with the value of the "assetId" property in the passed object', function(){
          expect(entry.entryId).toEqual('entry-1');
        });
      });
    });

    describe('#lookupVideoInProvider', function() {
      beforeEach(function() {
        KalturaEditorControllerMixin.lookupVideoInProvider('entry-1');
      });

      it('calls #entry method in KalturaClientWrapper', function() {
        expect(kalturaClientWrapperMock.entry).toHaveBeenCalledWith('entry-1');
      });
    });

    describe('#shouldRenderVideoPlayer', function() {
      var shouldRender;
      describe('when the "entryId" property is present in the given object', function() {
        beforeEach(function() {
          shouldRender = KalturaEditorControllerMixin.shouldRenderVideoPlayer({entryId: 'entry-id'});
        });

        it('returns true', function() {
          expect(shouldRender).toBeTruthy();
        });
      });
      describe('when the "entryId" property is not present in the given object', function() {
        beforeEach(function() {
          shouldRender = KalturaEditorControllerMixin.shouldRenderVideoPlayer({});
        });

        it('returns true', function() {
          expect(shouldRender).toBeFalsy();
        });
      });
    });

    describe('#prepareSearch', function() {
      beforeEach(function() {
        KalturaEditorControllerMixin.prepareSearch('query value');
      });

      it('instantiates a KalturaSearch object', function() {
        expect(kalturaSearchMock).toHaveBeenCalled();
      });

      it('calls the #where method in the search object', function() {
        expect(kalturaSearchInstanceMock.where).toHaveBeenCalledWith('nameLike', 'query value');
      });

      it('calls the #limit method in the search object', function() {
        expect(kalturaSearchInstanceMock.limit).toHaveBeenCalledWith(10);
      });
    });

    describe('#processSearchResults', function() {
      describe('for every search result', function() {
        var result, descriptor;
        beforeEach(function() {
          result     = { id: 1, msDuration: 99, name: 'name', thumbnailUrl: 'url' };
          descriptor = KalturaEditorControllerMixin.processSearchResults([result])[0];
        });

        it('returns an object that describes the search result', function() {
          expect(descriptor.id).toEqual(result.id);
          expect(descriptor.duration).toEqual(result.msDuration);
          expect(descriptor.name).toEqual(result.name);
          expect(descriptor.thumbnailUrl).toEqual(result.thumbnailUrl);
        });
      });
    });
    
  });


});
