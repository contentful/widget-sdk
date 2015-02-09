'use strict';

describe('UrlEditorController', function () {
  beforeEach(function () {
    module('contentful/test');

    this.scope = this.$inject('$rootScope').$new();
    dotty.put(this.scope, 'fieldData.value', null);

    this.controller = this.$inject('$controller')('UrlEditorController', {$scope: this.scope});
    this.$apply();
  });

  describe('validates the URL', function () {
    it('has undefined state when no URL is present', function () {
      expect(this.scope.state).toBe(undefined);
    });

    it('has undefined state when URL is valid', function () {
      this.scope.fieldData.value = 'http://contentful.com/something';
      this.$apply();
      expect(this.scope.state).toBe(undefined);
    });

    it('has invalid state when URL is invalid', function () {
      this.scope.fieldData.value = 'b0rk3dhttp://contentful.com/something';
      this.$apply();
      expect(this.scope.state).toBe('invalid');
    });
  });
});
