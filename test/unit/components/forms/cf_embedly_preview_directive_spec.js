'use strict';

describe('cfEmbedlyPreview Directive', function () {
  var $q;
  var deferredEmbedlyResponse;

  beforeEach(function () {
    module('contentful/test');

    $q = this.$inject('$q');
    deferredEmbedlyResponse = $q.defer();

    this.$inject('LazyLoader').get = function () {
      var stubbedEmbedly = function (type, element, callback) {
        if (type === 'card' &&
            element.localName === 'a' &&
            element.hasAttribute('href')) {
          element.innerHTML = 'I am a card from ' + element.getAttribute('href');
        } else if (type === 'on') {
          deferredEmbedlyResponse.resolve = callback;
        }
      };

      return $q.when(stubbedEmbedly);
    };

    this.compileElement = function (defaultValue) {
      defaultValue = defaultValue || null;
      var scopeProps = { fieldData: { value: dotty.get(this, 'scope.fieldData.value') || defaultValue } };
      this.element = this.$compile('<cf-embedly-preview field-data="fieldData" />', scopeProps);
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

    it('changes cards when the value changes', function () {
      this.compileElement('http://contentful.com');
      expect(this.element[0].firstChild.innerHTML).toBe('I am a card from http://contentful.com');
      this.scope.fieldData.value = 'http://joistio.com';
      this.compileElement();
      expect(this.element[0].children.length).toBe(1);
      expect(this.element[0].firstChild.innerHTML).toBe('I am a card from http://joistio.com');
      this.scope.fieldData.value = 'meh, a boring string';
      this.compileElement();
      expect(this.element[0].children.length).toBe(0);
    });
  });

  describe('changes state depending on value', function () {
    it('updates state when the field changes', function () {
      // Initial state is undefined
      this.compileElement();
      expect(this.scope.state).toBe(undefined);
    });
    it('changes state to loading and then broken when URL is broken', function () {
      // Add a URL
      this.compileElement('http://404site.com');
      expect(this.scope.state).toBe('loading');
      // Simulate a 404 by making the iframe's contentWindow null
      deferredEmbedlyResponse.resolve({contentWindow: null});
      expect(this.scope.state).toBe('broken');
    });
  });
});
