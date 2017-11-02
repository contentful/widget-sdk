'use strict';

describe('cfSearch Directive', function () {
  let element, scope, isolateScope, compileElement;
  afterEach(function () {
    element.remove();
    element = scope = isolateScope = compileElement = null;
  });

  beforeEach(function () {
    module('contentful/test');
    const $compile = this.$inject('$compile');
    const $rootScope = this.$inject('$rootScope');

    scope = $rootScope.$new();
    compileElement = function () {
      element = $compile('<div class="search-field" cf-search="searchTerm"></div>')(scope);
      scope.$digest();
      isolateScope = element.isolateScope();
    };
  });

  describe('sets properties on scope', function () {
    beforeEach(function () {
      scope.searchTerm = 'term';
      compileElement();
    });

    it('search', function () {
      expect(isolateScope.search).toBe('term');
    });

    it('inner search term', function () {
      expect(isolateScope.inner.term).toBe('term');
    });

    describe('updates state from button', function () {
      beforeEach(function () {
        isolateScope.inner.term = undefined;
        isolateScope.update = sinon.stub();
        isolateScope.updateFromButton();
      });

      it('presets inner term to empty string', function () {
        expect(isolateScope.inner.term).toBe('');
      });

      it('updates state with button trigger', function () {
        sinon.assert.calledWith(isolateScope.update, {trigger: 'button'});
      });
    });

    it('updates state with new term', function () {
      isolateScope.inner.term = 'newterm';
      isolateScope.update();
      expect(isolateScope.search).toBe('newterm');
    });

    it('updates state with empty term', function () {
      isolateScope.inner.term = '';
      isolateScope.update();
      expect(isolateScope.search).toBe('');
    });

    describe('updates state with same term', function () {
      let params;
      beforeEach(function () {
        params = {};
        isolateScope.inner.term = 'term';
        isolateScope.$emit = sinon.stub();
        isolateScope.update(params);
      });

      it('term doesnt change', function () {
        expect(isolateScope.search).toBe('term');
      });

      it('emits event with given parans', function () {
        sinon.assert.calledWith(isolateScope.$emit, 'refreshSearch', params);
      });
    });
  });
});
