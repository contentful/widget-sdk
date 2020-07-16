import React from 'react';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { combine, getValue } from 'core/utils/kefir';
import { user$, spacesByOrganization$ as spacesByOrg$ } from 'services/TokenStore';
import { organizations$ } from 'services/TokenStore';
import { getModule } from 'core/NgRegistry';
import { getSpaceAutoCreatedKey } from './getSpaceAutoCreatedKey';
import {
  getFirstOwnedOrgWithoutSpaces,
  hasAnOrgWithSpaces,
  ownsAtleastOneOrg,
  getCurrOrg,
  isUserOrgCreator,
} from 'data/User';
import { create } from 'components/shared/auto_create_new_space/CreateModernOnboarding';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { CreateSampleSpaceModal } from './CreateSampleSpaceModal';

const store = getBrowserStorage();
let creatingSampleSpace = false;

/**
 * @description
 * Auto creates a space using the product catalogue template
 * for a qualified user.
 * It is hooked up in the run block in application prelude.
 */
export function init() {
  combine([user$, spacesByOrg$])
    .filter(([user, spacesByOrg]) => {
      return user && spacesByOrg && qualifyUser(user, spacesByOrg) && !creatingSampleSpace;
    })
    .onValue(async ([user, spacesByOrg]) => {
      const org = getFirstOwnedOrgWithoutSpaces(user, spacesByOrg);

      creatingSampleSpace = true;

      create({
        markOnboarding,
        onDefaultChoice: () => {
          defaultChoice({ org, user });
        },
        org,
        user,
      });

      function markOnboarding(action = 'success') {
        store.set(getSpaceAutoCreatedKey(user, action), true);
      }
    });
}

function defaultChoice({ org, user }) {
  const handleSpaceCreationSuccess = (createdSpace) => {
    store.set(getSpaceAutoCreatedKey(user, 'success'), true);
    store.set(`ctfl:${user.sys.id}:modernStackOnboarding:contentChoiceSpace`, createdSpace.sys.id);

    creatingSampleSpace = false;
  };

  const handleSpaceCreationFailure = () => {
    // serialize the fact that auto space creation failed to localStorage
    // to power any behaviour to work around the failure
    store.set(getSpaceAutoCreatedKey(user, 'failure'), true);

    creatingSampleSpace = false;
  };

  ModalLauncher.open(({ isShown, onClose }) => (
    <CreateSampleSpaceModal
      isShown={isShown}
      onClose={onClose}
      organization={org}
      onFail={handleSpaceCreationFailure}
      onSuccess={handleSpaceCreationSuccess}
    />
  ));
}

function qualifyUser(user, spacesByOrg) {
  return (
    !attemptedSpaceAutoCreation(user) && // no auto space creation was attempted
    currentUserIsCurrentOrgCreator(user) && // current user created the current org aka Pioneer User
    !hasAnOrgWithSpaces(spacesByOrg) && // user has no space memberships in any org that they are a member of
    ownsAtleastOneOrg(user) // user owns atleast one org
  );
}

function currentUserIsCurrentOrgCreator(user) {
  const $stateParams = getModule('$stateParams');
  const orgId = $stateParams.orgId;
  const orgs = getValue(organizations$);
  const currOrg = getCurrOrg(orgs, orgId);

  return !!currOrg && isUserOrgCreator(user, currOrg);
}

function attemptedSpaceAutoCreation(user) {
  return (
    store.get(getSpaceAutoCreatedKey(user, 'success')) ||
    store.get(getSpaceAutoCreatedKey(user, 'failure'))
  );
}
