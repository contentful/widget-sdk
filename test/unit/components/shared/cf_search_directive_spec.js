'use strict';

describe('cfSearch Directive', () => {
  let element, scope, isolateScope, compileElement;
  afterEach(() => {
    element.remove();
    element = scope = isolateScope = compileElement = null;
  });

  beforeEach(function () {
    module('contentful/test');
    const $compile = this.$inject('$compile');
    const $rootScope = this.$inject('$rootScope');

    scope = $rootScope.$new();
    compileElement = () => {
      element = $compile('<div class="search-field" cf-search="searchTerm"></div>')(scope);
      scope.$digest();
      isolateScope = element.isolateScope();
    };
  });

  describe('sets properties on scope', () => {
    beforeEach(() => {
      scope.searchTerm = 'term';
      compileElement();
    });

    it('search', () => {
      expect(isolateScope.search).toBe('term');
    });

    it('inner search term', () => {
      expect(isolateScope.inner.term).toBe('term');
    });

    describe('updates state from button', () => {
      beforeEach(() => {
        isolateScope.inner.term = undefined;
        isolateScope.update = sinon.stub();
        isolateScope.updateFromButton();
      });

      it('presets inner term to empty string', () => {
        expect(isolateScope.inner.term).toBe('');
      });

      it('updates state with button trigger', () => {
        sinon.assert.calledWith(isolateScope.update, {trigger: 'button'});
      });
    });

    it('updates state with new term', () => {
      isolateScope.inner.term = 'newterm';
      isolateScope.update();
      expect(isolateScope.search).toBe('newterm');
    });

    it('updates state with empty term', () => {
      isolateScope.inner.term = '';
      isolateScope.update();
      expect(isolateScope.search).toBe('');
    });

    describe('updates state with same term', () => {
      let params;
      beforeEach(() => {
        params = {};
        isolateScope.inner.term = 'term';
        isolateScope.$emit = sinon.stub();
        isolateScope.update(params);
      });

      it('term doesnt change', () => {
        expect(isolateScope.search).toBe('term');
      });

      it('emits event with given parans', () => {
        sinon.assert.calledWith(isolateScope.$emit, 'refreshSearch', params);
      });
    });
  });
});
