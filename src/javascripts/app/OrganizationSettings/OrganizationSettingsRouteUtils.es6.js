import { onFeatureFlag } from 'utils/LaunchDarkly';

export function iframeStateWrapper(definition = {}) {
  const { title } = definition;
  const defaults = {
    params: {
      pathSuffix: ''
    },
    template: getIframeTemplate(title)
  };

  return Object.assign(defaults, definition);
}

export function reactStateWrapper(definition = {}) {
  const { componentPath } = definition;
  const defaults = {
    controller: getController(definition),
    template: getReactTemplate(componentPath)
  };

  return Object.assign(defaults, definition);
}

export function conditionalStateWrapper(definition = {}) {
  const { title, componentPath } = definition;

  const defaults = {
    controller: getController(definition),
    template: `
      <div>
        <div ng-if="useNewView === false">${getIframeTemplate(title)}</div>
        <div ng-if="useNewView">${getReactTemplate(componentPath)}</div>
      </div>
    `
  };

  return Object.assign(defaults, definition);
}

function getController(definitions) {
  const { featureFlag } = definitions;
  return [
    '$scope',
    '$stateParams',
    function($scope, $stateParams) {
      $scope.properties = {
        ...$stateParams,
        context: $scope.context,
        onReady: () => {
          $scope.context.ready = true;
          $scope.$applyAsync();
        },
        onForbidden: () => {
          $scope.context.forbidden = true;
          $scope.$applyAsync();
        }
      };

      featureFlag &&
        onFeatureFlag($scope, featureFlag, value => {
          $scope.useNewView = value;
        });
    }
  ];
}

function getReactTemplate(componentPath) {
  return `<react-component name="${componentPath}" props="properties" />`;
}

function getIframeTemplate(title) {
  return `
    <div>
      <div class="workbench-header__wrapper">
        <header class="workbench-header">
          <h1 class="workbench-header__title">${title}</h1>
        </header>
      </div>
      <cf-account-view context="context" />
    </div>
  `;
}
