'use strict';

angular.module('contentful').directive('cfExtensionEditor', [
  'require',
  require => {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const ExtensionEditor = require('app/Extensions/ExtensionEditor.es6').default;
    const leaveConfirmator = require('navigation/confirmLeaveEditor');
    const spaceContext = require('spaceContext');
    const notification = require('notification');

    return {
      restrict: 'E',
      template: '<div class="mount-point"></div>',
      scope: true,
      link: function(scope, el) {
        let entity = scope.extension;
        scope.context.requestLeaveConfirmation = leaveConfirmator(save);

        ReactDOM.render(
          React.createElement(ExtensionEditor, {
            entity: entity,
            onChange: onChange,
            save: save
          }),
          el[0].querySelector('.mount-point')
        );

        function onChange(change) {
          entity = change.entity;
          scope.context.dirty = change.dirty;
          scope.$applyAsync();
        }

        function save() {
          return spaceContext.cma.updateExtension(entity).then(
            response => {
              notification.info('Your extension was updated successfully.');
              entity = response;

              // We refresh the widget store used by the entry editor so
              // the newest version of an extension is available right away.
              return spaceContext.widgets.refresh().then(function() {
                return entity;
              });
            },
            err => {
              notification.error(
                [
                  'There was an error while saving your extension.',
                  'See validation errors for more details.'
                ].join(' ')
              );
              return Promise.reject(err);
            }
          );
        }
      }
    };
  }
]);
