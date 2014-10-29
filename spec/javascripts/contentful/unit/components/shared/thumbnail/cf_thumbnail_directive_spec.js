'use strict';

describe('cfThumbnailDirective Directive', function () {
  var scope, asset, element, src, $compile;

  beforeEach(function() {
    module('contentful/test');
    asset = {url: 'url'};

    inject(function($injector, $rootScope){
      $compile    = $injector.get('$compile');
      scope       = $rootScope.$new();
      scope.asset = asset;
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  function createElement(attrs) {
    var defaults = { file: 'asset' };
    attrs        = _.defaults(attrs || {}, defaults);

    element = $('<div class="cf-thumbnail"></div>');
    _.forIn(attrs, function(v, k){ element.attr(k, v); });
    element.css({height: '10px', width: '10px'});

    $compile(element)(scope);
    scope.$apply();

    src = element.find('img').attr('src');
  }

  describe('any asset', function() {
    describe('size attr', function() {
      var size = 100;

      beforeEach(function() {
        asset.details ={ image: { width: 5000, height: 9999 } };

        createElement({size: size});
      });

      it('sets the max width for the thumbnail', function() {
        expect(scope.$$childHead.width <= size).toBeTruthy();
      });

      it('sets the max height for the thumbnail', function() {
        expect(scope.$$childHead.height <= size).toBeTruthy();
      });
    });
  });

  describe('contentful assets', function() {
    beforeEach(function() {
      asset.details = { image: { width: 100, height: 300 } };
      createElement();
    });

    it('sets the width parameter in the querystring to scope.width', function() {
      expect(src).toMatch(new RegExp('w=' + scope.$$childHead.width));
    });

    it('sets the height parameter in the querystring to scope.height', function() {
      expect(src).toMatch(new RegExp('h=' + scope.$$childHead.height));
    });

    it('sets the fit parameter in the querystring to the value on attrs.fit', function() {
      createElement({fit: 'crop'});

      expect(src).toMatch(/fit=crop/);
    });

    it('sets the f parameter in the querystring to the value on attrs.focus', function() {
      createElement({focus: 'faces'});

      expect(src).toMatch(/f=faces/);
    });

  });

  describe('external assets', function() {
    it('uses the asset url property as the value for the src attribute', function() {
      asset.external = true;
      createElement();

      expect(src).toBe(asset.url);
    });
  });
});

