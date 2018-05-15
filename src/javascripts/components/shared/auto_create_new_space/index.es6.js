import { getStore } from 'TheStore';
import {combine} from 'utils/kefir';
import {getCurrentVariation} from 'utils/LaunchDarkly';
import {user$, spacesByOrganization$ as spacesByOrg$} from 'services/TokenStore';
import createSampleSpace from './CreateSampleSpace';
import seeThinkDoFeatureModalTemplate from './SeeThinkDoTemplate';

import {
  getFirstOwnedOrgWithoutSpaces,
  hasAnOrgWithSpaces,
  ownsAtleastOneOrg,
  getUserAgeInDays
} from 'data/User';

import {create} from 'createModernOnboarding';

const store = getStore();

/**
 * @description
 * Auto creates a space using the product catalogue template
 * for a qualified user.
 * It is hooked up in the run block in application prelude.
 */
export function init () {
  let creatingSampleSpace = false;

  combine([user$, spacesByOrg$])
    .filter(([user, spacesByOrg]) => user && spacesByOrg && qualifyUser(user, spacesByOrg) && !creatingSampleSpace)
    .onValue(async ([user, spacesByOrg]) => {
      const org = getFirstOwnedOrgWithoutSpaces(user, spacesByOrg);

      creatingSampleSpace = true;

      let modernStackVariation = false;
      try {
        modernStackVariation = await getCurrentVariation('feature-dl-05-2018-modern-stack-onboarding');
      } catch (e) {
        // pass
      }

      if (modernStackVariation) {
        create({
          onDefaultChoice: defaultChoice
        });
        return;
      } else {
        defaultChoice();
      }

      async function defaultChoice () {
        let variation = false;

        try {
          variation = await getCurrentVariation('feature-ps-11-2017-project-status');
        } finally {
          // if getCurrentVariation throws, auto create the usual way
          const template = variation ? seeThinkDoFeatureModalTemplate : undefined;

          // we swallow all errors, so auto creation modal will always have green mark
          await createSampleSpace(org, 'the example app', template).catch(() => {});
          store.set(getKey(user), true);
          creatingSampleSpace = false;
        }
      }
    });
}

function qualifyUser (user, spacesByOrg) {
  return !hadSpaceAutoCreated(user) &&
    isRecentUser(user) &&
    !hasAnOrgWithSpaces(spacesByOrg) &&
    ownsAtleastOneOrg(user);
}

function hadSpaceAutoCreated (user) {
  return store.get(getKey(user));
}

// qualify a user if it was created in the last week
function isRecentUser (user) {
  return getUserAgeInDays(user) <= 7;
}

function getKey (user) {
  return `ctfl:${user.sys.id}:spaceAutoCreated`;
}
