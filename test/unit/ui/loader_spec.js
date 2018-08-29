'use strict';

describe('cfLoaders', () => {
  beforeEach(function() {
    module('contentful/test');

    this.$rootScope = this.$inject('$rootScope');

    this.compile = directive => {
      return function(isShownProp, isShown, loaderMsg, watchStateChange = true) {
        let template = `<${directive} `;

        template += isShownProp ? `is-shown=${isShownProp} ` : '';
        template += loaderMsg ? `loader-msg="${loaderMsg}" ` : '';
        template += `watch-state-change="${watchStateChange}" />`;

        const $el = this.$compile(template);
        const scope = $el.find(':first-child').scope();

        scope.$parent[isShownProp] = isShown;
        scope.$apply();

        return { $el, scope };
      };
    };

    this.assertStateChangeVal = function(event, isShown, watchStateChange) {
      const { scope } = this.compileLoader(undefined, isShown, '', watchStateChange);
      this.emitStateEvent(event);
      this.$apply();
      expect(scope.isShown).toBe(isShown);
    };

    this.assertIsShownBinding = function(isShownProp, isShown, watchStateChange) {
      const { scope } = this.compileLoader(isShownProp, isShown, 'Please wait…', watchStateChange);
      const tests = [true, 'WOOP', false];

      expect(scope.isShown).toBe(isShown);

      tests.forEach(t => {
        scope.$parent[isShownProp] = t;
        this.$apply();
        expect(scope.isShown).toBe(scope.$parent[isShownProp]);
      });
    };

    this.assertAttrs = function(isShownProp, isShown, loaderMsg, watchStateChange) {
      const { scope } = this.compileLoader(isShownProp, isShown, loaderMsg, watchStateChange);
      const defaultMsg = 'Please hold on…';

      expect(scope.isShown).toEqual(isShown);
      expect(scope.loaderMsg).toEqual(loaderMsg || defaultMsg);
    };

    this.testScopeAttrs = function() {
      this.assertAttrs();
      this.assertAttrs('isLoading', true);
      this.assertAttrs('isLoading', false, 'Test');
    };

    this.emitStateEvent = function(event) {
      const options = { notify: true };
      this.$rootScope.$emit(event, {}, {}, {}, {}, options);
    };
  });

  describe('cfLoader', () => {
    beforeEach(function() {
      this.compileLoader = this.compile('cf-loader');
    });

    it('uses the attrs to populate scope properties', function() {
      this.testScopeAttrs();
    });

    it('should update isShown based on the parent property it is bound to', function() {
      const { scope } = this.compileLoader('isSearching', 'TEST', 'Please wait…');

      expect(scope.isShown).toBe('TEST');
      scope.$parent.isSearching = true;
      this.$apply();
      expect(scope.isShown).toBe(true);
    });

    it('adds handlers for state change events when watchStateChange is true', function() {
      // watchStateChange is true by default when the directive is compiled in these tests
      this.assertStateChangeVal('$stateChangeStart', true);
      this.assertStateChangeVal('$stateChangeSuccess', false);
      this.assertStateChangeVal('$stateChangeCancel', false);
      this.assertStateChangeVal('$stateNotFound', false);
      this.assertStateChangeVal('$stateChangeError', false);
    });

    it('attaches handlers for state events when watchStateChange is false', function() {
      this.assertStateChangeVal('$stateChangeStart', undefined, false);
      this.assertStateChangeVal('$stateChangeSuccess', undefined, false);
      this.assertStateChangeVal('$stateChangeCancel', undefined, false);
      this.assertStateChangeVal('$stateNotFound', undefined, false);
      this.assertStateChangeVal('$stateChangeError', undefined, false);
    });

    it('hides the loader when `$stateChangeStart` event listener sets `notify: false`', function() {
      const isShown = true;
      const watchStateChange = true;
      const { scope } = this.compileLoader(undefined, isShown, '', watchStateChange);
      this.$rootScope.$on(
        '$stateChangeStart',
        (_event, _toState, _toParams, _fromState, _fromParams, options) => {
          options.notify = false;
        }
      );
      this.emitStateEvent('$stateChangeStart');
      this.$apply();
      expect(scope.isShown).toBe(false);
    });
  });

  describe('cfInlineLoader', () => {
    beforeEach(function() {
      this.compileLoader = this.compile('cf-inline-loader');
    });

    it('binds `isShown` to scope', function() {
      this.assertIsShownBinding('isSearching', 'INITVAL');
    });
  });
});
