'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name navigation/requestLeaveEditor
 * @description
 * Exports a factory that creates a function that request the user to
 * confirm leaving an editor with unsaved changes.
 *
 * The user is presented with a dialog with a “Save changes” and
 * a “Discard changes” option. Clicking the “Save changes” button will
 * run the action passed to the factory.
 *
 * ~~~js
 * var createLeaveConfirmator = require('navigation/requestLeaveEditor')
 * function save () {
 *   return runSave
 *   .then(function () {
 *      // do something
 *   })
 * }
 * $scope.context.confirmLeaveEditor = createLeaveConfirmator(save)
 * ~~~
 */
.factory('navigation/confirmLeaveEditor', ['require', require => {
  var modalDialog = require('modalDialog');
  var Command     = require('command');

  return function createLeaveConfirmator (runSave, template) {
    return function confirmLeaveEditor () {
      var dialog;
      var save = Command.create(() => runSave().then(() => {
        dialog.confirm({saved: true});
      }, error => {
        dialog.cancel(error);
      }));

      var discard = Command.create(() => {
        dialog.confirm({discarded: true});
      });

      var cancel = Command.create(() => {
        dialog.confirm(false);
      });

      dialog = modalDialog.open({
        template: template || 'confirm_leave_editor',
        backgroundClose: false,
        ignoreEnter: false,
        enterAction: function () {
          save.execute();
        },
        scopeData: {
          actions: {save: save, discard: discard, cancel: cancel},
        }
      });

      return dialog.promise;
    };
  };

}]);
