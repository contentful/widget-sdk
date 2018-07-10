import modalDialog from 'modalDialog';
import { getOrganization } from 'services/TokenStore';
import { openModal as openCommittedSpaceWarningDialog } from 'components/shared/space-wizard/CommittedSpaceWarningModal';
import { getSingleSpacePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

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
 * @param {string} action - one of 'change', 'create'.
 * @param {string} scope - The scope of the call (from a space or organization page). One of 'space', 'organization'.
 * @param {function} onSubmit
 */
export async function showDialog ({ organizationId, space, limitReached, action, scope, onSubmit }) {
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

  if (!scope) {
    throw new Error('ChangeSpaceService.showDialog: scope required but not supplied');
  }

  if (validActions.indexOf(action) === -1) {
    throw new Error(`ChangeSpaceService.showDialog: action ${action} invalid, valid actions: ${validActions.join(', ')}`);
  }

  const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
  const spacePlan = await getSingleSpacePlan(orgEndpoint, space.sys.id);

  if (spacePlan && spacePlan.committed) {
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
