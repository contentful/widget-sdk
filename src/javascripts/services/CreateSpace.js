import React from 'react';
import { Notification, Spinner, Modal } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { getOrganization } from 'services/TokenStore';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import createResourceService from 'services/ResourceService';
import { canCreateSpaceInOrganization } from 'access_control/AccessChecker';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import ModalLauncher from 'app/common/ModalLauncher';
import {
  getSpaceRatePlans,
  isEnterprisePlan,
  getBasePlan,
  isHighDemandEnterprisePlan,
} from 'account/pricing/PricingDataProvider';
import { getModule } from 'NgRegistry';
import LegacyNewSpaceModal from './CreateSpace/LegacyNewSpaceModal';

function Loading() {
  const spinnerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: tokens.spacingL,
  };

  return (
    <div style={spinnerStyle}>
      <Spinner size="large" />
    </div>
  );
}

/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * Accepts one required parameter - `organizationId`;
 *
 * @param {string} organizationId
 */
export async function showDialog(organizationId) {
  const modalDialog = getModule('modalDialog');
  const spaceContext = getModule('spaceContext');

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

    return;
  }

  if (isLegacyOrganization(organization)) {
    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <LegacyNewSpaceModal
          isShown={isShown}
          onClose={onClose}
          organization={organization}
          spaceContext={spaceContext}
        />
      );
    });
  } else {
    let closeLoadingModal;

    ModalLauncher.open(({ isShown, onClose }) => {
      closeLoadingModal = onClose;
      return (
        <Modal isShown={isShown} onClose={onClose}>
          <Loading />
        </Modal>
      );
    });

    const orgEndpoint = createOrganizationEndpoint(organizationId);
    const basePlan = await getBasePlan(orgEndpoint);
    // org should create POC if it is Enterprise
    const shouldCreatePOC = isEnterprisePlan(basePlan);

    if (shouldCreatePOC) {
      const resources = createResourceService(organizationId, 'organization');
      const freeSpaceIdentifier = 'free_space';
      const [freeSpaceResource, ratePlans] = await Promise.all([
        resources.get(freeSpaceIdentifier),
        getSpaceRatePlans(orgEndpoint),
      ]);
      const freeSpaceRatePlan = ratePlans.find(
        (plan) => plan.productPlanType === freeSpaceIdentifier
      );
      const modalProps = {
        freeSpaceRatePlan,
        freeSpaceResource,
        isHighDemand: isHighDemandEnterprisePlan(basePlan),
        organization: {
          sys: organization.sys,
          name: organization.name,
        },
      };
      modalDialog.open({
        template: `
          <react-component
            watch-depth="reference"
            name="components/shared/enterprise-space-wizard/EnterpriseSpaceWizard"
            class="modal-background"
            props="modalProps"
          ></react-component>
        `,
        scopeData: { modalProps },
        backgroundClose: false,
        persistOnNavigation: true,
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
            isBillable: organization.isBillable,
          },
        },
      });
    }

    if (closeLoadingModal) {
      closeLoadingModal();
    }
  }
}
