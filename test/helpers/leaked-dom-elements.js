import { toArray } from 'lodash';

beforeEach(function() {
  this._angularElements = [];
});

afterEach(function() {
  // Destroy all elements created with `this.$compile()`
  this._angularElements.forEach(el => {
    el.remove();
  });
  delete this._angularElements;

  let $rootElement;
  let $rootScope;

  inject($injector => {
    $rootElement = $injector.get('$rootElement');
    $rootScope = $injector.get('$rootScope');
  });

  // Destroy root element
  $rootElement.remove();

  // Destroy all scopes
  $rootScope.$destroy();

  // Warn if there is still an element
  const bodyChildren = toArray(document.body.children);
  const leakedElements = bodyChildren.filter(
    el => el.tagName !== 'SCRIPT' && el.tagName !== 'LINK'
  );

  leakedElements.forEach(el => el.remove());
});
