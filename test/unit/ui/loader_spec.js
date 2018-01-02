'use strict';

describe('cfLoaders', function () {
  beforeEach(function () {
    module('contentful/test');

    this.$rootScope = this.$inject('$rootScope');

    this.compile = function (directive) {
      return function (isShownProp, isShown, loaderMsg, watchStateChange = true) {
        let template = `<${directive} `;

        template += isShownProp ? `is-shown=${isShownProp} ` : '';
        template += loaderMsg ? `loader-msg="${loaderMsg}" ` : '';
        template += `watch-state-change="${watchStateChange}" />`;

        const $el = this.$compile(template);
        const scope = $el.find(':first-child').scope();

        scope.$parent[isShownProp] = isShown;
        scope.$apply();

        return { $el, scope };
      }.bind(this);
    };

    this.assertStateChangeVal = function (event, isShown, watchStateChange) {
      const { scope } = this.compileLoader(undefined, isShown, '', watchStateChange);

      this.$rootScope.$emit(event);
      this.$apply();
      expect(scope.isShown).toBe(isShown);
    };

    this.assertIsShownBinding = function (isShownProp, isShown, watchStateChange) {
      const { scope } = this.compileLoader(isShownProp, isShown, 'Please wait…', watchStateChange);
      const tests = [true, 'WOOP', false];

      expect(scope.isShown).toBe(isShown);

      tests.forEach(t => {
        scope.$parent[isShownProp] = t;
        this.$apply();
        expect(scope.isShown).toBe(scope.$parent[isShownProp]);
      });
    };

    this.assertAttrs = function (isShownProp, isShown, loaderMsg, watchStateChange) {
      const { scope } = this.compileLoader(isShownProp, isShown, loaderMsg, watchStateChange);
      const defaultMsg = 'Please hold on…';

      expect(scope.isShown).toEqual(isShown);
      expect(scope.loaderMsg).toEqual(loaderMsg || defaultMsg);
    };

    this.testScopeAttrs = function () {
      this.assertAttrs();
      this.assertAttrs('isLoading', true);
      this.assertAttrs('isLoading', false, 'Test');
    };
  });

  describe('cfLoader', function () {
    beforeEach(function () {
      this.compileLoader = this.compile('cf-loader');
    });

    it('should use the attrs to populate scope properties', function () {
      this.testScopeAttrs();
    });

    it('should update isShown based on the parent property it is bound to', function () {
      const { scope } = this.compileLoader('isSearching', 'TEST', 'Please wait…');

      expect(scope.isShown).toBe('TEST');
      scope.$parent.isSearching = true;
      this.$apply();
      expect(scope.isShown).toBe(true);
    });

    it('should add handlers for state change events when watchStateChange is true', function () {
      // watchStateChange is true by default when the directive is compiled in these tests
      this.assertStateChangeVal('$stateChangeStart', true);
      this.assertStateChangeVal('$stateChangeSuccess', false);
      this.assertStateChangeVal('$stateChangeCancel', false);
      this.assertStateChangeVal('$stateNotFound', false);
      this.assertStateChangeVal('$stateChangeError', false);
    });

    it('should not attach handlers for state events when watchStateChange is false', function () {
      this.assertStateChangeVal('$stateChangeStart', undefined, false);
      this.assertStateChangeVal('$stateChangeSuccess', undefined, false);
      this.assertStateChangeVal('$stateChangeCancel', undefined, false);
      this.assertStateChangeVal('$stateNotFound', undefined, false);
      this.assertStateChangeVal('$stateChangeError', undefined, false);
    });
  });

  describe('cfInlineLoader', function () {
    beforeEach(function () {
      this.compileLoader = this.compile('cf-inline-loader');
    });

    it('should bind isShown to scope', function () {
      this.assertIsShownBinding('isSearching', 'INITVAL');
    });
  });
});
