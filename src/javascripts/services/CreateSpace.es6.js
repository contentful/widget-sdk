import modalDialog from 'modalDialog';
import {getOrganization} from 'services/TokenStore';
import {isLegacyOrganization} from 'utils/ResourceUtils';
import {canCreateSpaceInOrganization} from 'access_control/AccessChecker';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import notification from 'notification';
import {getSpaceRatePlans} from 'account/pricing/PricingDataProvider';
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

  const productTypes = {
    partnership: 'partnership',
    onDemand: 'on_demand',
    enterprise: 'committed'
  };

  const orgEndpoint = createOrganizationEndpoint(organizationId);
  // get all rate plans (a.k.a space types) available for the current org.
  const ratePlans = await getSpaceRatePlans(orgEndpoint);
  // it's garanteed that every product contains a 'free_space' rate plan
  const freeSpaceRatePlan = ratePlans.find(plan => plan.productPlanType === 'free_space');
  // we use the free_space plan to find what's the product type for this org
  const productType = freeSpaceRatePlan.productType;
  const isEnterprise = productType === productTypes.enterprise;

  if (isLegacyOrganization(organization)) {
    modalDialog.open({
      title: 'Space templates',
      template: '<cf-create-new-space class="modal-background"></cf-create-new-space>',
      backgroundClose: false,
      persistOnNavigation: true,
      scopeData: {organization}
    });
  } else {
    if (isEnterprise) {
      const modalProps = {
        ratePlans,
        organization: {
          sys: organization.sys,
          name: organization.name
        }
      };
      modalDialog.open({
        template: '<react-component name="components/shared/enterprise-space-wizard/EnterpriseSpaceWizard" class="modal-background" props="modalProps"></react-component>',
        scopeData: {modalProps},
        backgroundClose: false,
        persistOnNavigation: true
      });
    } else {
      modalDialog.open({
        title: 'Create new space',
        template: '<cf-space-wizard class="modal-background"></cf-space-wizard>',
        backgroundClose: false,
        persistOnNavigation: true,
        scopeData: {
          action: 'create',
          organization: {
            sys: organization.sys,
            name: organization.name,
            isBillable: organization.isBillable
          }
        }
      });
    }
  }
}
