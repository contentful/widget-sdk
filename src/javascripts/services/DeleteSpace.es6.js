import { h } from 'utils/legacy-html-hyperscript/index.es6';
import { extend } from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import * as TokenStore from 'services/TokenStore.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { openModal as openCommittedSpaceWarningDialog } from 'components/shared/space-wizard/CommittedSpaceWarningModal.es6';
import { getModule } from 'NgRegistry.es6';

const $rootScope = getModule('$rootScope');
const modalDialog = getModule('modalDialog');
const Command = getModule('command');
const ApiClient = getModule('data/ApiClient');

export function openDeleteSpaceDialog({ space, plan, onSuccess }) {
  if (plan && plan.committed) {
    return openCommittedSpaceWarningDialog();
  }

  const spaceName = space.name;
  const scope = extend($rootScope.$new(), {
    spaceName,
    input: { spaceName: '' },
    remove: Command.create(
      () =>
        remove(space)
          .then(() => {
            scope.dialog.confirm();
          })
          .then(onSuccess),
      { disabled: () => scope.input.spaceName !== spaceName }
    )
  });

  return modalDialog.open({
    template: removalConfirmation(),
    noNewScope: true,
    scope
  });
}

function remove(space) {
  const endpoint = createSpaceEndpoint(space.sys.id);
  const client = new ApiClient(endpoint);

  return client
    .deleteSpace()
    .then(TokenStore.refresh)
    .then(() => {
      Notification.success(`Space ${space.name} deleted successfully.`);
    })
    .catch(ReloadNotification.basicErrorHandler);
}

function removalConfirmation() {
  const content = [
    h('p', [
      'You are about to remove space ',
      h('span.modal-dialog__highlight', { ngBind: 'spaceName' }),
      '.'
    ]),
    h('p', [
      h('strong', [
        `All space contents and the space itself will be removed.
         This operation cannot be undone.`
      ])
    ]),
    h('p', ['To confirm, type the name of the space in the field below:']),
    h('input.cfnext-form__input--full-size', { ngModel: 'input.spaceName' })
  ];

  const controls = [
    h('button.btn-caution', { uiCommand: 'remove' }, ['Remove']),
    h('button.btn-secondary-action', { ngClick: 'dialog.cancel()' }, ['Don’t remove'])
  ];

  return modalDialog.richtextLayout('Remove space', content, controls);
}
