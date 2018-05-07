'use strict';

angular.module('contentful')
.directive('cfExtensionEditor', ['require', function (require) {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var ExtensionEditor = require('app/Extensions/ExtensionEditor').default;
  var leaveConfirmator = require('navigation/confirmLeaveEditor');
  var spaceContext = require('spaceContext');
  var notification = require('notification');

  return {
    restrict: 'E',
    template: '<div class="mount-point"></div>',
    scope: true,
    link: function (scope, el) {
      var entity = scope.extension;
      scope.context.requestLeaveConfirmation = leaveConfirmator(save);

      ReactDOM.render(
        React.createElement(ExtensionEditor, {
          entity: entity,
          onChange: onChange,
          save: save
        }),
        el[0].querySelector('.mount-point')
      );

      function onChange (change) {
        entity = change.entity;
        scope.context.dirty = change.dirty;
        scope.$applyAsync();
      }

      function save () {
        return spaceContext.cma.updateExtension(entity)
        .then(function (response) {
          notification.info('Your Extension was updated successfully.');
          entity = response;
          return entity;
        }, function (err) {
          notification.error([
            'There was an error while saving your Extension.',
            'See validation errors for more details.'
          ].join(' '));
          return Promise.reject(err);
        });
      }
    }
  };
}]);
