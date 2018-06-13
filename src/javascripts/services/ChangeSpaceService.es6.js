import modalDialog from 'modalDialog';
import { getOrganization } from 'services/TokenStore';

export {SpaceResourceTypes} from 'components/shared/space-wizard/WizardUtils';

/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * @param {string} organizationId
 * @param {object?} space - optional space to upgrade
 * @param {Array<object>?} limitsReached - optional used to determine recommended plan
 *    based on which limits were reached:
 *    {
 *      resourceType: <WizardUtils.SpaceResourceTypes>`,
 *      usage: <number>
 *    }
 * @param {string} action - one of 'change', 'upgrade', 'downgrade'.
 * @param {function} onSubmit
 */
export async function showDialog ({ organizationId, space, limitReached, action, onSubmit }) {
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
      limitReached,
      organization,
      onSubmit
    }
  });
}
