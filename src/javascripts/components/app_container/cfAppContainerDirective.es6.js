import { registerDirective } from 'NgRegistry.es6';
import { h } from 'utils/legacy-html-hyperscript/index.es6';

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
    })
  ].join('');
}

export default function register() {
  registerDirective('cfAppContainer', () => ({
    template: appContainerTemplateDef(),
    restrict: 'E',
    controller: [
      '$scope',
      function($scope) {
        $scope.sidePanelIsShown = false;
        $scope.toggleSidePanel = () => {
          $scope.sidePanelIsShown = !$scope.sidePanelIsShown;
          $scope.$applyAsync();
        };
      }
    ]
  }));
}
