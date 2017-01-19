import $rootScope from '$rootScope';
import $compile from '$compile';
import $window from '$window';

const scope = $rootScope.$new(true);
let el = null;

export function show () {
  if (!el) {
    el = $compile('<cf-mock-xhr-console/>')(scope);
    $window.document.body.appendChild(el[0]);
  }

  scope.$applyAsync(function () {
    scope.isVisible = true;
  });

  return 'you can mock xhr requests now! ;-)';
}
