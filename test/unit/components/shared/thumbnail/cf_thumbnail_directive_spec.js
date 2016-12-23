'use strict';

describe('cfThumbnailDirective', function () {
  beforeEach(function () {
    module('contentful/test');

    const $compile = this.$inject('$compile');
    const $rootScope = this.$inject('$rootScope');
    this.compile = function (file, attrs = {}) {
      const element = $('<div cf-thumbnail></div>');
      const scope = $rootScope.$new();
      scope.file = file;
      attrs.file = 'file';
      element.attr(attrs);
      $compile(element)(scope);
      scope.$apply();
      return element;
    };
  });

  describe('file without preview', function () {
    beforeEach(function () {
      this.el = this.compile({url: 'url'});
    });

    it('does not render image', function () {
      expect(this.el.find('img').get(0)).toBeUndefined();
    });

    it('renders icon', function () {
      expect(this.el.find('i').get(0)).toBeDefined();
    });
  });

  describe('file with image preview', function () {
    const imageUrl = 'https://images.contentful.com/path';

    beforeEach(function () {
      const compile = this.compile;
      this.compile = function (attrs) {
        const file = {
          url: imageUrl,
          contentType: 'image/png'
        };
        return compile(file, attrs);
      };
    });

    it('does not render icon', function () {
      const el = this.compile();
      expect(el.find('i').get(0)).toBe(undefined);
    });

    it('fails with no size params', function () {
      const el = this.compile();
      expect(el.find('img').attr('src')).toBe(undefined);
    });

    it('with size', function () {
      const el = this.compile({size: '300'});
      expect(el.find('img').attr('src')).toBe(`${imageUrl}?w=300&h=300&`);
    });

    it('with width and height', function () {
      const el = this.compile({width: '300', height: '300'});
      expect(el.find('img').attr('src')).toBe(`${imageUrl}?w=300&h=300&`);
    });
  });
});
