import { registerDirective } from 'NgRegistry';
import { h } from 'utils/legacy-html-hyperscript';

function appContainerTemplateDef() {
  return [
    h('cf-persistent-notification', {
      role: 'banner'
    }),
    h('div', {
      uiView: 'nav-bar'
    }),
    h('div.app-container__content', {
      uiView: 'content'
    }),
    h('div', { 'ng-if': 'showIeNotice' }, [
      h('react-component', { name: 'components/Ie11DeprecationNotice' })
    ])
  ].join('');
}

export default function register() {
  registerDirective('cfAppContainer', () => ({
    template: appContainerTemplateDef(),
    restrict: 'E',
    controller: [
      '$scope',
      function($scope) {
        // requires a timeout because appContainer is initialized before
        // react-component directive
        setTimeout(() => {
          $scope.showIeNotice = true;
        }, 4000);
      }
    ]
  }));
}
