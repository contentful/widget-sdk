import modalDialog from 'modalDialog';
import spaceContext from 'spaceContext';
import {getOrganization} from 'services/TokenStore';
import {isLegacyOrganization} from 'utils/ResourceUtils';
/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * Accepts one optional parameter - `organizationId`; organization from
 * `spaceContext` will be used by default.
 *
 * @param {string} [organizationId]
 */
export async function showDialog (organizationId) {
  let organization;

  if (!organizationId) {
    organization = spaceContext.organization;
    organizationId = organization.sys.id;
  } else {
    organization = await getOrganization(organizationId);
  }

  if (isLegacyOrganization(organization)) {
    modalDialog.open({
      title: 'Space templates',
      template: '<cf-create-new-space class="modal-background"></cf-create-new-space>',
      backgroundClose: false,
      persistOnNavigation: true,
      scopeData: {organizationId}
    });
  } else {
    modalDialog.open({
      title: 'Create new space',
      template: '<cf-create-space-wizard class="modal-background"></cf-create-space-wizard>',
      backgroundClose: false,
      persistOnNavigation: true,
      scopeData: {organizationId}
    });
  }
}
