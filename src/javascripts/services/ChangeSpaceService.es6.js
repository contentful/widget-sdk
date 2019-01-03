import { getOrganization } from 'services/TokenStore.es6';
import { openModal as openCommittedSpaceWarningDialog } from 'components/shared/space-wizard/CommittedSpaceWarningModal.es6';
import { openModal as openPOCSpaceWarningDialog } from 'components/shared/space-wizard/POCSpaceWarningModal.es6';
import { getSingleSpacePlan, isPOCSpacePlan } from 'account/pricing/PricingDataProvider.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getModule } from 'NgRegistry.es6';

const modalDialog = getModule('modalDialog');

/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * @param {string} organizationId
 * @param {object?} space - optional space to upgrade
 * @param {string} action - one of 'change', 'create'.
 * @param {string} scope - The scope of the call (from a space or organization page). One of 'space', 'organization'.
 * @param {function} onSubmit
 */
export async function showDialog({ organizationId, space, action, scope, onSubmit }) {
  const validActions = ['change', 'upgrade', 'downgrade'];

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
    throw new Error(
      `ChangeSpaceService.showDialog: action ${action} invalid, valid actions: ${validActions.join(
        ', '
      )}`
    );
  }

  const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
  const spacePlan = await getSingleSpacePlan(orgEndpoint, space.sys.id);

  if (spacePlan && spacePlan.committed) {
    openCommittedSpaceWarningDialog();
  } else if (isPOCSpacePlan(spacePlan)) {
    openPOCSpaceWarningDialog();
  } else {
    modalDialog.open({
      title: 'Create new space',
      template: '<cf-space-wizard class="modal-background"></cf-space-wizard>',
      backgroundClose: false,
      persistOnNavigation: true,
      scopeData: {
        action,
        scope,
        space,
        organization,
        onSubmit
      }
    });
  }
}
