import { registerFactory } from 'NgRegistry.es6';

export default function register() {
  registerFactory('authorization', [
    () => {
      let accessChecker;
      let logger;
      let worf;

      function Authorization() {}

      Authorization.prototype = {
        authContext: null,
        spaceContext: null,
        init: async function() {
          [logger, accessChecker, { default: worf }] = await Promise.all([
            import('services/logger.es6'),
            import('access_control/AccessChecker/index.es6'),
            import('@contentful/worf')
          ]);
        },
        update: function(
          tokenLookup,
          space,
          enforcements,
          environmentId,
          isMasterEnvironment,
          newEnforcement
        ) {
          this.authContext = null;
          this.spaceContext = null;
          this._tokenLookup = tokenLookup;
          this._space = space;

          const environment = {
            sys: {
              id: environmentId,
              isMaster: isMasterEnvironment
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
            this.spaceContext.newEnforcement = newEnforcement;
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
