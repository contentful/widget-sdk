import modalDialog from 'modalDialog';
import { getSpace } from 'services/TokenStore';
import { canPerformActionOnEntity } from 'access_control/AccessChecker';
import notification from 'notification';
/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * Accepts one required parameter - `organizationId`;
 *
 * @param {string} organizationId
 */
export async function showDialog (spaceId, action) {
  const validActions = [ 'change', 'upgrade', 'downgrade' ];

  if (!spaceId) {
    throw new Error('spaceId not supplied for space creation');
  }

  if (!action) {
    throw new Error('ChangeSpaceService.showDialog: action required but not supplied');
  }

  if (validActions.indexOf(action) === -1) {
    throw new Error(`ChangeSpaceService.showDialog: action ${action} invalid, valid actions: ${validActions.join(', ')}`);
  }

  const space = await getSpace(spaceId);

  // This should not happen as create space button must be hidden when user
  // has no rights to do it.
  // See https://contentful.tpondemand.com/entity/18031-user-without-create-space-permission-can
  if (!space || !canPerformActionOnEntity('update', space)) {
    notification.error(`You don’t have rights to ${action} this space, plase contact your organization’s administrator.`);
  }

  modalDialog.open({
    title: 'Create new space',
    template: '<cf-space-wizard class="modal-background"></cf-space-wizard>',
    backgroundClose: false,
    persistOnNavigation: true,
    scopeData: {
      action: action
    }
  });
}
