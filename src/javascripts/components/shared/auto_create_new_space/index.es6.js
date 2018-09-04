import { getStore } from 'TheStore';
import { combine } from 'utils/kefir.es6';
import { getCurrentVariation } from 'utils/LaunchDarkly';
import { user$, spacesByOrganization$ as spacesByOrg$ } from 'services/TokenStore.es6';
import createSampleSpace from './CreateSampleSpace.es6';
import seeThinkDoFeatureModalTemplate from './SeeThinkDoTemplate.es6';

import { getFirstOwnedOrgWithoutSpaces, hasAnOrgWithSpaces, ownsAtleastOneOrg } from 'data/User';

import { create } from 'createModernOnboarding';

const store = getStore();

/**
 * @description
 * Auto creates a space using the product catalogue template
 * for a qualified user.
 * It is hooked up in the run block in application prelude.
 */
export function init() {
  let creatingSampleSpace = false;

  combine([user$, spacesByOrg$])
    .filter(
      ([user, spacesByOrg]) =>
        user && spacesByOrg && qualifyUser(user, spacesByOrg) && !creatingSampleSpace
    )
    .onValue(async ([user, spacesByOrg]) => {
      const org = getFirstOwnedOrgWithoutSpaces(user, spacesByOrg);

      creatingSampleSpace = true;

      let modernStackVariation = false;
      try {
        modernStackVariation = await getCurrentVariation(
          'feature-dl-05-2018-modern-stack-onboarding'
        );
      } catch (e) {
        // pass
      }

      if (modernStackVariation) {
        create({
          markOnboarding,
          onDefaultChoice: async () => {
            const newSpace = await defaultChoice();

            store.set(
              `ctfl:${user.sys.id}:modernStackOnboarding:contentChoiceSpace`,
              newSpace.sys.id
            );
          },
          org,
          user
        });
        return;
      } else {
        defaultChoice();
      }

      async function defaultChoice() {
        let variation = false;
        let newSpace;

        try {
          variation = await getCurrentVariation('feature-ps-11-2017-project-status');
        } finally {
          // if getCurrentVariation throws, auto create the usual way
          const template = variation ? seeThinkDoFeatureModalTemplate : undefined;

          // we swallow all errors, so auto creation modal will always have green mark
          newSpace = await createSampleSpace(org, 'the example app', template).then(
            newSpace => {
              store.set(getKey(user, 'success'), true);

              return newSpace;
            },
            () => {
              // serialize the fact that auto space creation failed to localStorage
              // to power any behaviour to work around the failure
              store.set(getKey(user, 'failure'), true);
            }
          );

          creatingSampleSpace = false;
        }
        return newSpace;
      }

      function markOnboarding(action = 'success') {
        store.set(getKey(user, action), true);
      }
    });
}

function qualifyUser(user, spacesByOrg) {
  return (
    !attemptedSpaceAutoCreation(user) && !hasAnOrgWithSpaces(spacesByOrg) && ownsAtleastOneOrg(user)
  );
}

function attemptedSpaceAutoCreation(user) {
  return store.get(getKey(user, 'success')) || store.get(getKey(user, 'failure'));
}

export function getKey(user, action) {
  const prefix = `ctfl:${user.sys.id}`;

  if (action === 'success') {
    return `${prefix}:spaceAutoCreated`;
  }
  return `${prefix}:spaceAutoCreationFailed`;
}
