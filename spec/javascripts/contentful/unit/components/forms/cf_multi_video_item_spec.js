'use strict';

describe('Multi Video Item Controller', function() {
  var attrs, scope, multiVideoItemController, lookupAssetDeferred, $rootScope;

  beforeEach(function() {
    module('contentful/test');
    inject(function ($controller, $q, $injector) {
      $rootScope          = $injector.get('$rootScope');

      lookupAssetDeferred = $q.defer();

      scope                         = $rootScope.$new();
      scope.asset                   = {};

      // The following properties are set on this scope
      // for testing purpose but actually the'll coming
      // from somewhere else
      scope._playerDirective        = 'player-directive';
      scope._attributesForThePlayer = 'attrs';

      attrs               = {
        asset                   : 'asset',
        widgetPlayerDirective   : '_playerDirective',
        widgetPlayerCustomAttrs : '_attributesForThePlayer',
        lookupAsset             : jasmine.createSpy(),
        removeAsset             : jasmine.createSpy()
      };
      attrs.lookupAsset.and.returnValue(lookupAssetDeferred.promise);

      multiVideoItemController = $controller('cfMultiVideoItemController', {$scope: scope, $attrs: attrs});
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('fetches asset information', function() {
    it('calls the callback on it lookupAsset attribute', function() {
      expect(attrs.lookupAsset).toHaveBeenCalled();
    });

    describe('on successful lookup', function() {
      beforeEach(function() {
        lookupAssetDeferred.resolve({name: 'some asset title'});
        $rootScope.$apply();
      });

      it('sets the isAssetValid flag to true', function() {
        expect(scope.multiVideoItem.isAssetValid).toBeTruthy();
      });

      it('sets the asset title property to the response title', function() {
        expect(scope.multiVideoItem.asset.title).toEqual('some asset title');
      });
    });

    describe('on failed lookup', function() {
      beforeEach(function() {
        lookupAssetDeferred.reject({message: 'failed'});
        $rootScope.$apply();
      });

      it('sets the errorMessage property', function() {
        expect(scope.multiVideoItem.errorMessage).toBeDefined();
      });
    });
  });

  describe('multiVideoItem scope properties', function() {
    it('sets the asset property to the value in its asset attribute', function() {
      expect(scope.multiVideoItem.asset).toEqual(scope.asset);
    });

    it('sets the widgetPlayerDirective property to the value it its widgetPlayerDirective attribute', function() {
      expect(scope.multiVideoItem.widgetPlayerDirective).toEqual(scope._playerDirective);
    });

    it('sets the customAttrsForPlayer property to the value in its widgetPlayerCustomAttrs', function() {
      expect(scope.multiVideoItem.customAttrsForPlayer).toEqual(scope._attributesForThePlayer);
    });
  });


  describe('#removeAsset', function() {
    beforeEach(function() { multiVideoItemController.removeAsset(); });

    it('executes the callback on its removeAsset attribute', function() {
      expect(attrs.removeAsset).toHaveBeenCalled();
    });
  });

  describe('#notifyPlayerIsReady', function() {
    beforeEach(function() {
      multiVideoItemController.notifyPlayerIsReady();
    });

    it('sets the isPlayerReady flag to true', function() {
      expect(scope.multiVideoItem.isPlayerReady).toBeTruthy();
    });
  });

  describe('#showFailedToLoadVideoError', function() {
    beforeEach(function() {
      multiVideoItemController.showFailedToLoadVideoError();
    });

    it('sets the errorMessage property', function() {
      expect(scope.multiVideoItem.errorMessage).toBeDefined();
    });
  });
});
