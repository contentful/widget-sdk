import $rootScope from '$rootScope';
import $compile from '$compile';
import $window from '$window';

export default function init () {
  const scope = $rootScope.$new(true);
  const el = $compile('<cf-mock-xhr-console/>')(scope);
  $window.document.body.appendChild(el[0]);
  show();
  // TODO expose API to mock XHR requests
  return { show };

  function show () {
    scope.$applyAsync(function () {
      scope.isVisible = true;
    });
  }
}
