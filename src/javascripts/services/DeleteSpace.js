import { h } from 'utils/legacy-html-hyperscript';
import { extend } from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification';
import * as TokenStore from 'services/TokenStore';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { openModal as openCommittedSpaceWarningDialog } from 'components/shared/space-wizard/CommittedSpaceWarningModal';
import { getModule } from 'NgRegistry';
import APIClient from 'data/APIClient';
import { createCommand } from 'utils/command/command';
import { isEnterprisePlan, isFreeSpacePlan } from 'account/pricing/PricingDataProvider';

export function openDeleteSpaceDialog({ space, plan, onSuccess }) {
  const $rootScope = getModule('$rootScope');
  const modalDialog = getModule('modalDialog');

  if (plan && isEnterprisePlan(plan) && !isFreeSpacePlan(plan)) {
    return openCommittedSpaceWarningDialog();
  }

  const spaceName = space.name;
  const scope = extend($rootScope.$new(), {
    spaceName,
    input: { spaceName: '' },
    remove: createCommand(
      () =>
        remove(space)
          .then(() => {
            scope.dialog.confirm();
          })
          .then(onSuccess),
      { disabled: () => scope.input.spaceName !== spaceName.trim() }
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
  const client = new APIClient(endpoint);

  return client
    .deleteSpace()
    .then(TokenStore.refresh)
    .then(() => {
      Notification.success(`Space ${space.name} deleted successfully.`);
    })
    .catch(ReloadNotification.basicErrorHandler);
}

function removalConfirmation() {
  const modalDialog = getModule('modalDialog');

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
