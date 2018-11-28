import modalDialog from 'modalDialog';
import { Notification } from '@contentful/forma-36-react-components';
import { getOrganization } from 'services/TokenStore.es6';
import { isLegacyOrganization } from 'utils/ResourceUtils.es6';
import createResourceService from 'services/ResourceService.es6';
import { canCreateSpaceInOrganization } from 'access_control/AccessChecker';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import {
  getSpaceRatePlans,
  isPOCEnabled,
  isEnterprisePlan,
  getBasePlan
} from 'account/pricing/PricingDataProvider.es6';
import { openModal as showLoading } from 'components/shared/LoadingModal.es6';

/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * Accepts one required parameter - `organizationId`;
 *
 * @param {string} organizationId
 */
export async function showDialog(organizationId) {
  if (!organizationId) {
    throw new Error('organizationId not supplied for space creation');
  }

  const organization = await getOrganization(organizationId);

  // This should not happen as create space button must be hidden when user
  // has no rights to do it.
  // See https://contentful.tpondemand.com/entity/18031-user-without-create-space-permission-can
  if (!organization || !canCreateSpaceInOrganization(organizationId)) {
    Notification.error(
      'You don’t have rights to create a space, plase contact your organization’s administrator.'
    );
  }

  if (isLegacyOrganization(organization)) {
    modalDialog.open({
      title: 'Space templates',
      template: '<cf-create-new-space class="modal-background"></cf-create-new-space>',
      backgroundClose: false,
      persistOnNavigation: true,
      scopeData: { organization }
    });
  } else {
    const loadingModal = showLoading();

    // check if Proof of Concept spaces feature is on
    const canCreatePOC = await isPOCEnabled();
    const orgEndpoint = createOrganizationEndpoint(organizationId);

    let shouldCreatePOC;

    if (canCreatePOC) {
      const basePlan = await getBasePlan(orgEndpoint);
      // org should create POC if it is Enterprise
      shouldCreatePOC = isEnterprisePlan(basePlan);
    }

    if (shouldCreatePOC) {
      const resources = createResourceService(organizationId, 'organization');
      const freeSpaceIdentifier = 'free_space';
      const [freeSpaceResource, ratePlans] = await Promise.all([
        resources.get(freeSpaceIdentifier),
        getSpaceRatePlans(orgEndpoint)
      ]);
      const freeSpaceRatePlan = ratePlans.find(
        plan => plan.productPlanType === freeSpaceIdentifier
      );
      const modalProps = {
        freeSpaceRatePlan,
        freeSpaceResource,
        organization: {
          sys: organization.sys,
          name: organization.name
        }
      };
      modalDialog.open({
        template: `
          <react-component
            watch-depth="reference"
            name="components/shared/enterprise-space-wizard/EnterpriseSpaceWizard.es6"
            class="modal-background"
            props="modalProps"
          ></react-component>
        `,
        scopeData: { modalProps },
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

    loadingModal.destroy();
  }
}
