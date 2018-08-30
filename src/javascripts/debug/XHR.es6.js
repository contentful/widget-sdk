import $rootScope from '$rootScope';
import $compile from '$compile';
import $window from '$window';
import { assign } from 'utils/Collections.es6';
import * as XhrMock from './XHR/Mocker.es6';

export default function init() {
  const xhrMock = XhrMock.create();

  const scope = $rootScope.$new(true);
  scope.xhrMock = xhrMock;
  const el = $compile('<cf-mock-xhr-console/>')(scope);
  $window.document.body.appendChild(el[0]);

  show();

  return assign({ show }, xhrMock);

  function show() {
    scope.$applyAsync(() => {
      scope.isVisible = true;
    });
  }
}
