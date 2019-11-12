import sinon from 'sinon';
import $ from 'jquery';
import { $initialize, $inject } from 'test/utils/ng';

describe('cfThumbnailDirective', () => {
  beforeEach(async function() {
    // This is needed to transform the image domain
    this.system.set('services/TokenStore', {
      getDomains: sinon.stub().returns({})
    });

    await $initialize(this.system);

    const $compile = $inject('$compile');
    const $rootScope = $inject('$rootScope');
    this.compile = (file, attrs = {}) => {
      const element = $('<cf-thumbnail>');
      const scope = $rootScope.$new();
      scope.file = file;
      attrs.file = 'file';
      element.attr(attrs);
      $compile(element)(scope);
      scope.$apply();
      return element;
    };
  });

  describe('file without preview', () => {
    it('does not render preview for non-images MIME types', function() {
      const el = this.compile({
        url: '//images.contentful.com/image.png',
        contentType: 'application/json'
      });
      expect(el.find('img').get(0)).toBeUndefined();
    });

    it('renders icon according to MIME type', function() {
      const el = this.compile({
        url: 'url',
        contentType: 'video/h264'
      });
      expect(el.find('i.fa.fa-file-video-o').get(0)).toBeDefined();
    });
  });

  describe('file with image preview', () => {
    const imageUrl = 'https://images.contentful.com/path';

    beforeEach(function() {
      const compile = this.compile;
      this.compile = attrs => {
        const file = {
          url: imageUrl,
          contentType: 'image/png'
        };
        return compile(file, attrs);
      };
    });

    it('does not render icon', function() {
      const el = this.compile();
      expect(el.find('i').get(0)).toBe(undefined);
    });

    it('with size', function() {
      const el = this.compile({ size: '300' });
      expect(el.find('img').attr('src')).toBe(`${imageUrl}?w=300&h=300`);
    });

    it('with width and height', function() {
      const el = this.compile({ width: '300', height: '300' });
      expect(el.find('img').attr('src')).toBe(`${imageUrl}?w=300&h=300`);
    });
  });
});
