import {h} from 'utils/hyperscript';
import {extend} from 'lodash';
import $rootScope from '$rootScope';
import modalDialog from 'modalDialog';
import notification from 'notification';
import ReloadNotification from 'ReloadNotification';
import Command from 'command';
import * as TokenStore from 'services/TokenStore';
import {createSpaceEndpoint} from 'data/EndpointFactory';
import ApiClient from 'data/ApiClient';

export function openDeleteSpaceDialog ({space, onSuccess}) {
  const spaceName = space.name;
  const scope = extend($rootScope.$new(), {
    spaceName: spaceName,
    input: {spaceName: ''},
    remove: Command.create(
      () => remove(space).then(onSuccess),
      {disabled: () => scope.input.spaceName !== spaceName}
    )
  });

  return modalDialog.open({
    template: removalConfirmation(),
    noNewScope: true,
    scope: scope
  });
}

function remove (space) {
  const endpoint = createSpaceEndpoint(space.sys.id);
  const client = new ApiClient(endpoint);

  return client.deleteSpace()
  .then(TokenStore.refresh)
  .then(() => { notification.info(`Space ${space.name} deleted successfully.`); })
  .catch(ReloadNotification.basicErrorHandler);
}

function removalConfirmation () {
  const content = [
    h('p', [
      'You are about to remove space ',
      h('span.modal-dialog__highlight', {ngBind: 'spaceName'}), '.'
    ]),
    h('p', [
      h('strong', [
        `All space contents and the space itself will be removed.
         This operation cannot be undone.`
      ])
    ]),
    h('p', ['To confirm, type the name of the space in the field below:']),
    h('input.cfnext-form__input--full-size', {ngModel: 'input.spaceName'})
  ];

  const controls = [
    h('button.btn-caution', {uiCommand: 'remove'}, ['Remove']),
    h('button.btn-secondary-action', {ngClick: 'dialog.cancel()'}, ['Don’t remove'])
  ];

  return modalDialog.richtextLayout('Remove space', content, controls);
}
