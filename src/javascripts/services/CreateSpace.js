import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import { getOrganization } from 'services/TokenStore';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { canCreateSpaceInOrganization } from 'access_control/AccessChecker';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import { getModule } from 'core/NgRegistry';
import LegacyNewSpaceModal from './CreateSpace/LegacyNewSpaceModal';

import SpaceWizardsWrapper from 'app/SpaceWizards/SpaceWizardsWrapper';

/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * Accepts one required parameter - `organizationId`;
 *
 * @param {string} organizationId
 */
export async function showDialog(organizationId) {
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
    ModalLauncher.open(({ isShown, onClose }) => (
      <SpaceWizardsWrapper isShown={isShown} onClose={onClose} organization={organization} />
    ));
  }
}
