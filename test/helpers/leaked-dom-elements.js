import { toArray } from 'lodash';
import { $inject } from 'test/utils/ng';

beforeEach(function() {
  this._angularElements = [];
});

afterEach(function() {
  // Destroy all elements created with `this.$compile()`
  this._angularElements.forEach(el => {
    el.remove();
  });
  delete this._angularElements;

  // Destroy root element
  const $rootElement = $inject('$rootElement');
  $rootElement.remove();

  // Destroy all scopes
  const $rootScope = $inject('$rootScope');
  $rootScope.$destroy();

  // Warn if there is still an element
  const bodyChildren = toArray(document.body.children);
  const leakedElements = bodyChildren.filter(
    el => el.tagName !== 'SCRIPT' && el.tagName !== 'LINK'
  );

  leakedElements.forEach(el => el.remove());
});
