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
    element.attr(attrs);
    element.css({height: '10px', width: '10px'});

    $compile(element)(scope);
    scope.$apply();

    src = element.find('img').attr('src');
  }

  describe('any asset', function() {
    describe('size attr', function() {
      beforeEach(function() {
        asset.details ={ image: { width: 5000, height: 9999 } };

        createElement({size: 100});
      });

    /*
     * The expected values for 'width' and 'height' on these tests have
     * been manually calculated using the 'setDimensions' function inside the controller.
     */

      it('sets the max width for the thumbnail', function() {
        expect(src).toMatch(/w=50/);
      });

      it('sets the max height for the thumbnail', function() {
        expect(src).toMatch(/h=100/);
      });

      describe('when the format is "square"', function() {
        beforeEach(function() {
          createElement({size: 100, format: 'square'});
        });

        it('sets the max width for the thumbnail', function() {
          expect(src).toMatch(/w=100/);
        });

        it('sets the max height for the thumbnail', function() {
          expect(src).toMatch(/h=100/);
        });
      });
    });
  });

  describe('contentful assets', function() {
    beforeEach(function() {
      asset.details = { image: { width: 100, height: 300 } };
      createElement();
    });

    /*
     * The expected values for 'width' and 'height' on these tests have
     * been manually calculated using the 'setDimensions' function inside the controller.
     */

    it('sets the width parameter in the querystring to scope.width', function() {
      expect(src).toMatch(/w=3/);
    });

    it('sets the height parameter in the querystring to scope.height', function() {
      expect(src).toMatch(/h=10/);
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

