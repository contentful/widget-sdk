import modalDialog from 'modalDialog';
import {getOrganization} from 'services/TokenStore';
import {isLegacyOrganization} from 'utils/ResourceUtils';
import {canCreateSpaceInOrganization} from 'access_control/AccessChecker';
import notification from 'notification';
/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * Accepts one required parameter - `organizationId`;
 *
 * @param {string} organizationId
 */
export async function showDialog (organizationId) {
  if (!organizationId) {
    throw new Error('organizationId not supplied for space creation');
  }

  const organization = await getOrganization(organizationId);

  // This should not happen as create space button must be hidden when user
  // has no rights to do it.
  // See https://contentful.tpondemand.com/entity/18031-user-without-create-space-permission-can
  if (!organization || !canCreateSpaceInOrganization(organizationId)) {
    notification.error('You don’t have rights to create a space, plase contact your organization’s administrator.');
  }

  if (isLegacyOrganization(organization)) {
    modalDialog.open({
      title: 'Space templates',
      template: '<cf-create-new-space class="modal-background"></cf-create-new-space>',
      backgroundClose: false,
      persistOnNavigation: true,
      scopeData: {organization}
    });
  } else {
    modalDialog.open({
      title: 'Create new space',
      template: '<cf-create-space-wizard class="modal-background"></cf-create-space-wizard>',
      backgroundClose: false,
      persistOnNavigation: true,
      scopeData: {
        organization: {
          sys: organization.sys,
          name: organization.name,
          isBillable: organization.isBillable
        }
      }
    });
  }
}
