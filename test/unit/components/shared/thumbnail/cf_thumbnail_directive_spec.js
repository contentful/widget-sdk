'use strict';

describe('cfThumbnailDirective', function () {
  var scope, asset, element, src, $compile, hasPreviewStub;

  beforeEach(function() {
    module('contentful/test', function ($provide) {
      hasPreviewStub = sinon.stub();
      $provide.removeController('ThumbnailController', function ($scope) {
        $scope.hasPreview = hasPreviewStub;
      });
    });
    inject(function($injector, $rootScope){
      asset = {url: 'url'};
      $compile = $injector.get('$compile');

      scope       = $rootScope.$new();
      scope.asset = asset;
    });
  });

  function createElement(attrs) {
    var defaults = { file: 'asset' };
    attrs        = _.defaults(attrs || {}, defaults);

    element = $('<div class="cf-thumbnail"></div>');
    element.attr(attrs);

    $compile(element)(scope);
    scope.$apply();

    src = element.find('img').attr('src');
  }

  describe('icons', function() {
    beforeEach(function() {
      hasPreviewStub.returns(false);
      createElement();
    });

    it('does not render image', function() {
      expect(element.find('img').get(0)).toBeUndefined();
    });

    it('renders icon', function() {
      expect(element.find('i').get(0)).toBeDefined();
    });
  });

  describe('contentful assets', function() {
    beforeEach(function() {
      hasPreviewStub.returns(true);
    });

    it('does not render icon', function() {
      createElement();
      expect(element.find('i').get(0)).toBeUndefined();
    });

    it('fails with no size params', function() {
      createElement();
      expect(src).toBeUndefined();
    });

    it('with size', function() {
      createElement({ size: 300 });
      expect(src).toBe('url?w=300&h=300&');
    });

    it('with width and height', function() {
      createElement({ width: 300, height: 300 });
      expect(src).toBe('url?w=300&h=300&');
    });

    it('with width', function() {
      createElement({ width: 300 });
      expect(src).toBe('url?w=300&');
    });

    it('with height', function() {
      createElement({ height: 300 });
      expect(src).toBe('url?h=300&');
    });

    it('with fit', function() {
      createElement({ size: 300, fit: 'scale'});
      expect(src).toBe('url?w=300&h=300&fit=scale&');
    });

    it('fails silently with fit and one dimension', function() {
      createElement({ width: 300, fit: 'scale'});
      expect(src).toBe('url?w=300&');
    });

    it('with focus', function() {
      createElement({ size: 300, focus: 'bottom'});
      expect(src).toBe('url?w=300&h=300&f=bottom&');
    });

    it('fails silently with focus and one dimension', function() {
      createElement({ width: 300, focus: 'bottom'});
      expect(src).toBe('url?w=300&');
    });
  });

});

