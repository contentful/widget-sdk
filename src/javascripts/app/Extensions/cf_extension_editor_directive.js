'use strict';

angular.module('contentful')
.directive('cfExtensionEditor', ['require', require => {
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
        .then(response => {
          notification.info('Your extension was updated successfully.');
          entity = response;

          // We refresh the widget store used by the entry editor so
          // the newest version of an extension is available right away.
          return spaceContext.widgets.refresh().then(function () {
            return entity;
          });
        }, err => {
          notification.error([
            'There was an error while saving your extension.',
            'See validation errors for more details.'
          ].join(' '));
          return Promise.reject(err);
        });
      }
    }
  };
}]);
