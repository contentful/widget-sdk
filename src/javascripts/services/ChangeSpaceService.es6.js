import modalDialog from 'modalDialog';
import { getOrganization } from 'services/TokenStore';

/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * Accepts one required parameter - `organizationId`;
 *
 * @param {string} organizationId
 */
export async function showDialog ({ organizationId, space, action, onSubmit }) {
  const validActions = [ 'change', 'upgrade', 'downgrade' ];

  if (!organizationId) {
    throw new Error('organizationId not supplied for space creation');
  }

  const organization = await getOrganization(organizationId);

  if (!space) {
    throw new Error('space not supplied for space creation');
  }

  if (!action) {
    throw new Error('ChangeSpaceService.showDialog: action required but not supplied');
  }

  if (validActions.indexOf(action) === -1) {
    throw new Error(`ChangeSpaceService.showDialog: action ${action} invalid, valid actions: ${validActions.join(', ')}`);
  }

  modalDialog.open({
    title: 'Create new space',
    template: '<cf-space-wizard class="modal-background"></cf-space-wizard>',
    backgroundClose: false,
    persistOnNavigation: true,
    scopeData: {
      action,
      space,
      organization,
      onSubmit
    }
  });
}
