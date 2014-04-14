'use strict';

describe('searchField Directive', function () {
  var element, scope, isolateScope, compileElement;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($compile, $rootScope) {
      scope = $rootScope.$new();
      compileElement = function () {
        element = $compile('<div class="search-field" search="searchTerm" search-all="searchAllFlag"></div>')(scope);
        scope.$digest();
        isolateScope = element.isolateScope();
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('sets properties on scope', function() {
    beforeEach(function() {
      scope.searchTerm = 'term';
      scope.searchAllFlag = true;
      compileElement();
    });

    it('search', function() {
      expect(isolateScope.search).toBe('term');
    });

    it('inner search term', function() {
      expect(isolateScope.inner.term).toBe('term');
    });

    it('searchAll', function() {
      expect(isolateScope.searchAll).toBe(true);
    });

    it('resets searchAll', function() {
      isolateScope.resetSearchAll();
      expect(isolateScope.searchAll).toBe(false);
    });

    describe('updates state from button', function() {
      beforeEach(function() {
        isolateScope.inner.term = undefined;
        isolateScope.update = sinon.stub();
        isolateScope.updateFromButton();
      });

      it('presets inner term to empty string', function() {
        expect(isolateScope.inner.term).toBe('');
      });

      it('updates state', function() {
        expect(isolateScope.update).toBeCalled();
      });
    });

    describe('updates state with new term', function() {
      beforeEach(function() {
        isolateScope.inner.term = 'newterm';
        isolateScope.resetSearchAll = sinon.stub();
        isolateScope.update();
      });

      it('sets new search term', function() {
        expect(isolateScope.search).toBe('newterm');
      });

      it('resets search all flag', function() {
        expect(isolateScope.resetSearchAll).toBeCalled();
      });
    });

    describe('updates state with empty term', function() {
      beforeEach(function() {
        isolateScope.inner.term = '';
        isolateScope.resetSearchAll = sinon.stub();
        isolateScope.update();
      });

      it('sets new search term', function() {
        expect(isolateScope.search).toBe('');
      });

      it('sets searchAll flag to true', function() {
        expect(isolateScope.searchAll).toBeTruthy();
      });

      it('does not reset search all flag', function() {
        expect(isolateScope.resetSearchAll).not.toBeCalled();
      });
    });


  });

});
