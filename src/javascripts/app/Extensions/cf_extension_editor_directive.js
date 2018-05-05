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
      scope.context.ready = true;

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
        return spaceContext.endpoint({
          method: 'PUT',
          path: ['extensions', entity.sys.id],
          data: entity,
          version: entity.sys.version
        }).then(function (response) {
          notification.info('The Extension was updated successfully.');
          entity = response;
          return entity;
        }, function (err) {
          notification.error('There was an error while saving the Extension.');
          return Promise.reject(err);
        });
      }
    }
  };
}]);
