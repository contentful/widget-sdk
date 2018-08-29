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

  // Destroy root element
  const $rootElement = this.$inject('$rootElement');
  $rootElement.remove();

  // Destroy all scopes
  const $rootScope = this.$inject('$rootScope');
  $rootScope.$destroy();

  // Warn if there is still an element
  const bodyChildren = toArray(document.body.children);
  const leakedElements = bodyChildren.filter(
    el => el.tagName !== 'SCRIPT' && el.tagName !== 'LINK'
  );
  if (leakedElements.length > 0) {
    /* eslint no-console: off */
    console.warn(
      'Detected leaked element in document body.\n' +
        'Please make sure that your tests remove all DOM elements they create',
      leakedElements
    );
  }
  leakedElements.forEach(el => el.remove());
});
