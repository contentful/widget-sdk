import * as logger from 'services/logger';
import * as accessChecker from 'access_control/AccessChecker';
import worf from '@contentful/worf';

class Authorization {
  authContext = null;
  spaceContext = null;

  update(tokenLookup, space, enforcements, environmentId, isMasterEnvironment, newEnforcement) {
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
      return;
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
}

export default new Authorization();
