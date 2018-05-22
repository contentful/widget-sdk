'use strict';

angular.module('contentful')

.directive('cfWebhookSegmentation', ['require', function (require) {
  const React = require('react');
  const ReactDOM = require('react-dom');
  const WebhookSegmentation = require('app/Webhooks/WebhookSegmentation').default;
  const internalState = require('app/Webhooks/WebhookSegmentationState');

  return {
    restrict: 'E',
    template: '<div class="mount-point"></div>',
    scope: true,
    link: render
  };

  function render (scope, el) {
    const initialState = internalState.transformTopicsToMap(scope.webhook.topics)
    scope.initialState = initialState

    const ui = React.createElement(WebhookSegmentation, {
      onChange: onChange(scope),
      values: initialState
    });

    // This is used only by the tests to verify topics got translated to internal state properly

    ReactDOM.render(ui, el[0].querySelector('.mount-point'));
  }

  function onChange (scope) {
    return function (values) {
      scope.webhook.selection = values
      scope.webhook.topics = internalState.transformMapToTopics(values);
      scope.$applyAsync();
    };
  }
}]);
