angular.module('contentful')
.controller('SpaceSettingsController', ['require', '$scope', function (require, $scope) {
  var $q = require('$q');
  var $rootScope = require('$rootScope');
  var spaceContext = require('spaceContext');
  var Command = require('command');
  var tokenStore = require('tokenStore');
  var spaceTools = require('spaceTools');
  var modalDialog = require('modalDialog');
  var notification = require('notification');
  var ReloadNotification = require('ReloadNotification');
  var h = require('utils/hyperscript').h;

  $scope.context.ready = true;
  $scope.spaceId = spaceContext.space.getId();
  $scope.model = {name: spaceContext.space.data.name};
  $scope.save = Command.create(save, {disabled: isSaveDisabled});
  $scope.openRemovalDialog = Command.create(openRemovalDialog);

  function save () {
    return spaceContext.cma.renameSpace(
      $scope.model.name,
      spaceContext.space.getVersion()
    )
    .then(tokenStore.refresh)
    .then(function () {
      notification.info('Space renamed to ' + $scope.model.name + ' successfully.');
    })
    .catch(handleSaveError);
  }

  function handleSaveError (err) {
    if (dotty.get(err, 'data.details.errors', []).length > 0) {
      notification.error('Please provide a valid space name.');
    } else {
      ReloadNotification.basicErrorHandler();
    }
  }

  function remove () {
    return spaceContext.cma.deleteSpace()
    .then(tokenStore.refresh)
    .then(spaceTools.leaveCurrent)
    .then(function () {
      notification.info('Space ' + $scope.model.name + ' deleted successfully.');
    })
    .catch(ReloadNotification.basicErrorHandler);
  }

  function isSaveDisabled () {
    var input = dotty.get($scope, 'model.name');
    var currentName = dotty.get(spaceContext, 'space.data.name');

    return !input || input === currentName;
  }

  function openRemovalDialog () {
    var spaceName = spaceContext.space.data.name;
    var scope = _.extend($rootScope.$new(), {
      input: {spaceName: ''},
      remove: Command.create(remove, {
        disabled: function () {
          return scope.input.spaceName !== spaceName;
        }
      })
    });

    modalDialog.open({
      template: confirmationTemplate(spaceName),
      noNewScope: true,
      scope: scope
    });

    return $q.resolve();
  }

  function confirmationTemplate (spaceName) {
    return h('.modal-background',
      h('.modal-dialog', [
        h('header.modal-dialog__header',
          h('h1', 'Remove space')),
        h('.modal-dialog__content', [
          h('.modal-dialog__richtext', [
            h('p', [
              'You are about to remove space ',
              h('span.modal-dialog__highlight', spaceName), '.'
            ]),
            h('p',
              h('strong', [
                'All space contents and the space itself will removed. ',
                'This operation cannot be undone.'
              ])),
            h('p', 'To confirm, type the name of the space in the field below:'),
            h('input.cfnext-form__input--full-size', {ngModel: 'input.spaceName'})
          ])
        ]),
        h('.modal-dialog__controls', [
          h('button.btn-caution',
            {uiCommand: 'remove'}, 'Remove'),
          h('button.btn-secondary-action',
            {ngClick: 'dialog.cancel()'}, 'Don’t remove')
        ])
      ])
    );
  }
}]);
