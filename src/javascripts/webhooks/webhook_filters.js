'use strict';

angular.module('contentful')

.directive('cfWebhookFilters', ['require', function (require) {
  const React = require('react');
  const ReactDOM = require('react-dom');
  const WebhookFilters = require('app/Webhooks/Filters').default;
  const internalState = require('app/Webhooks/FiltersState');

  return {
    restrict: 'E',
    template: '<div class="mount-point"></div>',
    scope: true,
    link: render
  };

  function render (scope, el) {
    const ui = React.createElement(WebhookFilters, {
      filters: internalState.transformFiltersToList(scope.webhook.filters),
      onChange: onChange(scope)
    });

    ReactDOM.render(ui, el[0].querySelector('.mount-point'));
  }

  function onChange (scope) {
    return function (values) {
      scope.webhook.filters = internalState.transformListToFilters(values);
      scope.$applyAsync();
    };
  }
}]);
