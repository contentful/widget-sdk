import modalDialog from 'modalDialog';
import { getOrganization } from 'services/TokenStore';
import { openModal as openCommittedSpaceWarningDialog } from 'components/shared/space-wizard/CommittedSpaceWarningModal';

/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * @param {string} organizationId
 * @param {object?} space - optional space to upgrade
 * @param {object?} limitReached - optional used to determine recommended plan
 *    based on which limits were reached:
 *    {
 *      name: <string> - one of ResourceUtils.resourceHumanNameMap values,
 *      usage: <number>
 *    }
 * @param {string} action - one of 'change', 'upgrade', 'downgrade'.
 * @param {function} onSubmit
 */
export async function showDialog ({ organizationId, space, spacePlan, limitReached, action, onSubmit }) {
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

  if (spacePlan.committed) {
    openCommittedSpaceWarningDialog();
  } else {
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
}
