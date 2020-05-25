import { getOrganization } from 'services/TokenStore';
import {
  open as openChangeSpaceWarningModal,
  MODAL_TYPES,
} from 'app/SpaceWizards/ChangeSpaceWarning';
import { getSingleSpacePlan, isPOCSpacePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getModule } from 'core/NgRegistry';

/**
 * Creates a string to be passed to the notification
 *
 * @param {object} space - space that's been upgraded
 * @param {object} currentSpacePlan - the space's previous plan
 * @param {object} newSpacePlan - the space's new plan
 */
export const getNotificationMessage = (space, currentSpacePlan, newSpacePlan) => {
  let notificationMsg = `Space ${space.name} successfully`;

  if (currentSpacePlan) {
    const changeType = newSpacePlan.price >= currentSpacePlan.price ? 'upgraded' : 'downgraded';
    notificationMsg = `${notificationMsg} ${changeType} to a ${newSpacePlan.name} space.`;
  } else {
    notificationMsg = `${notificationMsg} changed.`;
  }

  return notificationMsg;
};

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
  const modalDialog = getModule('modalDialog');

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
    openChangeSpaceWarningModal(MODAL_TYPES.COMMITTED);
  } else if (isPOCSpacePlan(spacePlan)) {
    openChangeSpaceWarningModal(MODAL_TYPES.POC);
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
        onSubmit,
      },
    });
  }
}
