'use strict';

describe('cfEmbedlyPreview Directive', function () {
  let deferredEmbedlyResponse;

  afterEach(function () {
    deferredEmbedlyResponse = null;
  });

  beforeEach(function () {
    module('contentful/test');

    const $q = this.$inject('$q');
    deferredEmbedlyResponse = $q.defer();

    this.$inject('LazyLoader').get = function () {
      const stubbedEmbedly = function (type, element, callback) {
        if (type === 'card' &&
            element.localName === 'a' &&
            element.hasAttribute('href')) {
          element.innerHTML = 'I am a card from ' + element.getAttribute('href');
        } else if (type === 'on') {
          deferredEmbedlyResponse.resolve = callback;
        }
      };

      return $q.resolve(stubbedEmbedly);
    };

    this.compileElement = function (defaultValue) {
      defaultValue = defaultValue || null;
      const scopeProps = {
        previewUrl: dotty.get(this, 'scope.previewUrl') || defaultValue,
        urlStatus: 'loading'
      };
      this.element = this.$compile('<cf-embedly-preview preview-url="previewUrl" url-status="urlStatus" />', scopeProps);
      this.scope = this.element.isolateScope();
      this.$apply();
    }.bind(this);
  });

  describe('watches for value change', function () {
    it('is empty in the beginning', function () {
      this.compileElement();
      expect(this.element[0].children.length).toBe(0);
    });

    it('is empty when there is no URL', function () {
      this.compileElement('this-is-some string');
      expect(this.element[0].children.length).toBe(0);
    });

    it('gains a card when there is a URL', function () {
      this.compileElement('http://contentful.com');
      expect(this.element[0].children.length).toBe(1);
      expect(this.element[0].firstChild.innerHTML).toBe('I am a card from http://contentful.com');
    });

    it('gains a card when a URL with special characters is provided', function () {
      const url = 'https://www.k-rauta.fi/ratakaüppa/seinälaatta-primus-675-15x15-persikka-kiiltävä';
      const encodedUrl = encodeURI(url);

      this.compileElement(url);
      expect(this.element[0].children.length).toBe(1);
      expect(this.element[0].firstChild.innerHTML).toBe('I am a card from ' + encodedUrl);
    });

    it('changes cards when the value changes', function () {
      this.compileElement('http://contentful.com');
      expect(this.element[0].firstChild.innerHTML).toBe('I am a card from http://contentful.com');
      this.scope.previewUrl = 'http://joistio.com';
      this.compileElement();
      expect(this.element[0].children.length).toBe(1);
      expect(this.element[0].firstChild.innerHTML).toBe('I am a card from http://joistio.com');
      this.scope.previewUrl = 'meh, a boring string';
      this.compileElement();
      expect(this.element[0].children.length).toBe(0);
    });
  });

  describe('changes state depending on value', function () {
    it('updates state when the field changes', function () {
      // Initial state is invalid
      this.compileElement();
      expect(this.scope.urlStatus).toBe('ok');
    });

    it('changes state to loading and then broken when URL is broken', function () {
      // Add a URL
      this.compileElement('http://404site.com');
      expect(this.scope.urlStatus).toBe('loading');
      // Simulate a 404 by flushing timers without resolving
      this.$inject('$timeout').flush();
      expect(this.scope.urlStatus).toBe('broken');
    });

    it('changes state to "ok" when URL is empty', function () {
      this.compileElement('http://404site.com');
      expect(this.scope.urlStatus).toBe('loading');
      this.scope.previewUrl = '';
      this.$inject('$timeout').flush();
      expect(this.scope.urlStatus).toBe('ok');
    });
  });
});
