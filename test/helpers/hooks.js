'use strict';


afterEach(inject(function ($rootElement, $rootScope) {
  $rootScope.$destroy();
  $rootElement.remove();
}));

/**
 * These hooks clean up elements created with the `$compile()` helper
 * from `test/helpers/helpers`.
 */
beforeEach(function () {
  this._angularElements = [];
});

afterEach(function () {
  this._angularElements.forEach(function (el) {
    el.remove();
  });
  delete this._angularElements;
});
