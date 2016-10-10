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
 * var createLeaveConfirmator = $injector.get('navigation/requestLeaveEditor')
 * function save () {
 *   return runSave
 *   .then(function () {
 *      // do something
 *   })
 * }
 * $scope.context.confirmLeaveEditor = createLeaveConfirmator(save)
 * ~~~
 */
.factory('navigation/confirmLeaveEditor', ['$injector', function ($injector) {
  var modalDialog = $injector.get('modalDialog');
  var Command     = $injector.get('command');

  return function createLeaveConfirmator (runSave, template) {
    return function confirmLeaveEditor () {
      var dialog;
      var save = Command.create(function () {
        return runSave().then(function () {
          dialog.confirm(true);
        }, function (error) {
          dialog.cancel(error);
        });
      });

      var discard = Command.create(function () {
        dialog.confirm(true);
      });

      var cancel = Command.create(function () {
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
