import { registerDirective } from 'NgRegistry';
import { h } from 'utils/legacy-html-hyperscript/index';

function appContainerTemplateDef() {
  return [
    h('cf-persistent-notification', {
      role: 'banner'
    }),
    h('cf-nav-sidepanel', {
      isShown: 'sidePanelIsShown'
    }),
    h('div.app-top-bar', [
      h('cf-nav-sidepanel-trigger', {
        toggleSidePanel: 'toggleSidePanel'
      }),
      h('div.app-top-bar__outer-wrapper', {
        uiView: 'nav-bar'
      })
    ]),
    h('div.app-container__content', {
      uiView: 'content'
    }),
    h('div', { 'ng-if': 'showIeNotice' }, [
      h('react-component', { name: 'components/Ie11DeprecationNotice/index' })
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
        $scope.sidePanelIsShown = false;
        $scope.toggleSidePanel = () => {
          $scope.sidePanelIsShown = !$scope.sidePanelIsShown;
          $scope.$applyAsync();
        };
      }
    ]
  }));
}
