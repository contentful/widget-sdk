'use strict';

describe('cfEmbedlyPreview Directive', function () {
  beforeEach(function () {
    module('contentful/test');

    var $q = this.$inject('$q'),
        deferredEmbedlyResponse = $q.defer(),
        stubs = {};

    this.$inject('embedlyLoader').load = function () {
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

    this.$q = $q;
    this.deferredEmbedlyResponse = deferredEmbedlyResponse;
    this.stubs = stubs;
    this.scope = this.$inject('$rootScope').$new();
    dotty.put(this.scope, 'fieldData.value', null); 
    this.compileElement = function () {
      this.element = this.$inject('$compile')('<cf-embedly-preview></cf-embedly-preview>')(this.scope);
      this.$apply();
    };
    this.compileElement.bind(this);
  });

  describe('watches for value change', function () {
    it('is empty in the beginning', function () {
      this.compileElement();
      expect(this.element[0].children.length).toBe(0);
    });

    it('is empty when there is no URL', function () {
      this.scope.fieldData.value = 'this-is-some string';
      this.compileElement();
      expect(this.element[0].children.length).toBe(0);
    });

    it('gains a card when there is a URL', function () {
      this.scope.fieldData.value = 'http://contentful.com';
      this.compileElement();
      expect(this.element[0].children.length).toBe(1);
      expect(this.element[0].firstChild.innerHTML).toBe('I am a card from http://contentful.com');
    });

    it('changes cards when the value changes', function () {
      this.scope.fieldData.value = 'http://contentful.com';
      this.compileElement();
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
      this.scope.fieldData.value = 'http://404site.com';
      this.compileElement();
      expect(this.scope.state).toBe('loading');
      // Simulate a 404 by making the iframe's contentWindow null
      this.deferredEmbedlyResponse.resolve({contentWindow: null});
      expect(this.scope.state).toBe('broken');
    });
  });
});
