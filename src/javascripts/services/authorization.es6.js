'use strict';

angular.module('contentful').factory('authorization', [
  'require',
  require => {
    const worf = require('@contentful/worf');
    const logger = require('logger');
    const accessChecker = require('access_control/AccessChecker');

    function Authorization() {}

    Authorization.prototype = {
      authContext: null,
      spaceContext: null,
      update: function(tokenLookup, space, enforcements, environmentId) {
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
