import { registerFactory } from 'NgRegistry.es6';
import worf from '@contentful/worf';
import * as logger from 'services/logger.es6';
import createResourceService from 'services/ResourceService.es6';
import { ENVIRONMENT_USAGE_ENFORCEMENT } from 'featureFlags.es6';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';

const performNewUsageCheck = async (spaceId, environmentId) => {
  const service = createResourceService(spaceId);
  const result = await service.canCreateEnvironmentResources(environmentId);

  delete result.Locale;
  delete result.Record;

  return generateEnforcements(result);
};

function generateEnforcements(allowedToCreate) {
  const enforcements = [];
  let reasonsDenied = () => [];
  const deniedEntities = [];

  for (const entity in allowedToCreate) {
    if (!allowedToCreate[entity]) {
      deniedEntities.push(entity);

      const enforcement = {
        additionalPolicies: [],
        deniedPermissions: {
          deniedPerms: {},
          reason: 'usageExceeded'
        }
      };
      enforcement['deniedPermissions']['deniedPerms'][entity] = ['create'];

      enforcements.push({ Enforcement: enforcement });

      reasonsDenied = (action, entityType) => {
        return [
          'usageExceeded',
          `You do not have permissions to ${action} on ${entityType}, please contact your administrator for more information.`
        ];
      };
    }
  }

  return { enforcements, reasonsDenied, deniedEntities };
}

export default function register() {
  registerFactory('authorization', [
    'access_control/AccessChecker/index.es6',
    accessChecker => {
      function Authorization() {}

      Authorization.prototype = {
        authContext: null,
        spaceContext: null,
        update: async function(tokenLookup, space, enforcements, environmentId) {
          this.authContext = null;
          this.spaceContext = null;
          this._tokenLookup = tokenLookup;
          this._space = space;

          const environment = {
            sys: {
              id: environmentId,
              isMaster: environmentId === 'master'
            }
          };

          if (space && enforcements) {
            const tokenSpace = tokenLookup.spaces.find(({ sys }) => sys.id === space.getId());

            if (tokenSpace) {
              // See space_context.js
              //
              // Enforcements are now handled in a separate endpoint and are essentially
              // "patched" into the token information, which happens here.
              //
              // The reason Enforcements and the rest of the token are handled differently
              // is so that enforcement information can be updated in a much quicker time-
              // frame, every 30s, rather than the 5m token refresh timeframe.
              tokenSpace.enforcements = enforcements;
            }
          }

          try {
            this.authContext = worf(this._tokenLookup, environment);
          } catch (exp) {
            logger.logError('Worf initialization exception', {
              data: {
                exception: exp,
                tokenLookup: tokenLookup
              }
            });
          }

          if (space && this.authContext.hasSpace(space.getId())) {
            this.spaceContext = this.authContext.space(space.getId());
            this.spaceContext.newEnforcement = [];

            const allowNewUsageCheck = await getCurrentVariation(ENVIRONMENT_USAGE_ENFORCEMENT);

            if (allowNewUsageCheck) {
              this.spaceContext.newEnforcement = await performNewUsageCheck(
                this.spaceContext.space.sys.id,
                this.spaceContext.environment.sys.id
              );
            }
          }

          accessChecker.setAuthContext({
            authContext: this.authContext,
            spaceAuthContext: this.spaceContext
          });
        }
      };

      return new Authorization();
    }
  ]);
}
