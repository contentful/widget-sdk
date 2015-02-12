'use strict';

describe('Ooyala Editor Controller Mixin', function() {
  var OoyalaEditorControllerMixin, ooyalaClientSpy, ooyalaSearchStub, ooyalaSearchInstanceSpy,
      $rootScope;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      ooyalaClientSpy  = jasmine.createSpyObj('ooyalaClientSpy', ['asset']);
      ooyalaSearchStub = jasmine.createSpy('kalturaSearchMock');

      $provide.value('OoyalaSearch', ooyalaSearchStub);
      $provide.value('ooyalaClient', ooyalaClientSpy);
    });

    inject(function($injector){
      $rootScope                  = $injector.get('$rootScope');
      OoyalaEditorControllerMixin = $injector.get('OoyalaEditorControllerMixin');
    });

    ooyalaSearchInstanceSpy = jasmine.createSpyObj('ooyalaSearchInstanceMock', ['where', 'limit']);
    ooyalaSearchInstanceSpy.where.and.returnValue(ooyalaSearchInstanceSpy);
    ooyalaSearchStub.and.returnValue(ooyalaSearchInstanceSpy);
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('#isWidgetReady', function() {
    it('returns true', function() {
      expect(OoyalaEditorControllerMixin.isWidgetReady()).toBeTruthy();
    });
  });

  describe('#customAttrsForPlayer', function() {
    it('returns the passed object', function() {
      expect(OoyalaEditorControllerMixin.customAttrsForPlayer('object')).toEqual('object');
    });
  });

  describe('#customAttrsForPlayerInSearchDialog', function() {
    describe('the returned object', function() {
      var attrs;
      beforeEach(function() {
        attrs = OoyalaEditorControllerMixin.customAttrsForPlayerInSearchDialog({id: 'assetId-1'});
      });

      it('has the property "assetId" with the value of the "id" property in the passed object', function() {
        expect(attrs.assetId).toEqual('assetId-1');
      });
    });
  });

  describe('#loadingFeedbackMessage', function() {
    var message;
    beforeEach(function() {
      message = OoyalaEditorControllerMixin.loadingFeedbackMessage({assetId: 'assetId-1'});
    });

    it('returns a string with a feedback message for the player of the given video', function() {
      expect(message).toEqual('Loading player for video assetId-1');
    });
  });

  describe('#processLookupInProviderResult', function() {
    describe('the returned object', function() {
      var video;
      beforeEach(function() {
        video = OoyalaEditorControllerMixin.processLookupInProviderResult({embed_code: 'assetId-1', player_id: 'player-123', name: 'name-abc'});
      });

      it('has the property "assetId" with the value of the "embed_code" property in the passed object', function(){
        expect(video.assetId).toEqual('assetId-1');
      });

      it('has the property "playerId" with the value of the "player_id" property in the passed object', function() {
        expect(video.playerId).toEqual('player-123');
      });

      it('has the property "name" with the value of the "name" property in the passed object', function() {
        expect(video.name).toEqual('name-abc');
      });
    });
  });

  describe('#lookupVideoInProvider', function() {
    beforeEach(function() {
      OoyalaEditorControllerMixin.lookupVideoInProvider('asset-1');
    });

    it('calls #asset method in ooyalaClient', function() {
      expect(ooyalaClientSpy.asset).toHaveBeenCalledWith('asset-1');
    });
  });

  describe('#shouldRenderVideoPlayer', function() {
    var shouldRender;
    describe('when the "playerId" property is present in the given object', function() {
      beforeEach(function() {
        shouldRender = OoyalaEditorControllerMixin.shouldRenderVideoPlayer({playerId: 'player-123'});
      });

      it('returns true', function() {
        expect(shouldRender).toBeTruthy();
      });
    });
    describe('when the "playerId" property is not present in the given object', function() {
      beforeEach(function() {
        shouldRender = OoyalaEditorControllerMixin.shouldRenderVideoPlayer({});
      });

      it('returns false', function() {
        expect(shouldRender).toBeFalsy();
      });
    });
  });

  describe('#prepareSearch', function() {
    beforeEach(function() {
      OoyalaEditorControllerMixin.prepareSearch('query value');
    });

    it('instantiates a OoyalaSearch object', function() {
      expect(ooyalaSearchStub).toHaveBeenCalled();
    });

    it('calls the #where method in the search object', function() {
      expect(ooyalaSearchInstanceSpy.where).toHaveBeenCalledWith('name', 'query value');
    });

    it('calls the #limit method in the search object', function() {
      expect(ooyalaSearchInstanceSpy.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('#processSearchResults', function() {
    describe('for every search result', function() {
      var result, descriptor;
      beforeEach(function() {
        result     = { embed_code: 1, msDuration: 99, player_id: 'player-123', name: 'name', preview_image_url: 'url' };
        descriptor = OoyalaEditorControllerMixin.processSearchResults([result])[0];
      });

      it('returns an object that describes the search result', function() {
        expect(descriptor.id).toEqual(result.embed_code);
        expect(descriptor.duration).toEqual(result.msDuration);
        expect(descriptor.playerId).toEqual(result.player_id);
        expect(descriptor.name).toEqual(result.name);
        expect(descriptor.thumbnailUrl).toEqual(result.preview_image_url);
      });
    });
  });

});
