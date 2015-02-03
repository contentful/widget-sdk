'use strict';

describe('cfEmbedlyPreview Directive', function () {
  beforeEach(function () {
    module('contentful/test');

    var $q = this.$inject('$q'),
        stubs = {};

    this.$inject('embedlyLoader').load = function () {
      var stubbedEmbedly = function (type, element) {
        if (type === 'card' &&
            element.localName === 'a' &&
            element.hasAttribute('href')) {
          element.innerHTML = 'I am a card from ' + element.getAttribute('href');
        }
      };

      return $q.when(stubbedEmbedly);
    };

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
});
