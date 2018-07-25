'use strict';

angular.module('contentful')
.factory('authorization', ['require', require => {
  var worf = require('worf');
  var logger = require('logger');
  var accessChecker = require('access_control/AccessChecker');

  function Authorization () {}

  Authorization.prototype = {
    authContext: null,
    spaceContext: null,
    update: function (tokenLookup, space, enforcements, environmentId) {
      this.authContext = null;
      this.spaceContext = null;
      this._tokenLookup = tokenLookup;
      this._space = space;

      var environment = {
        sys: {
          id: environmentId,
          isMaster: environmentId === 'master'
        }
      };

      if (space && enforcements) {
        var tokenSpace = tokenLookup.spaces.find(({sys}) => sys.id === space.getId());
        if (tokenSpace) {
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
        try {
          this.spaceContext = this.authContext.space(space.getId());
        } catch (exp) {
          logger.logError('Worf authContext space exception', exp);
        }
      }

      accessChecker.setAuthContext({
        authContext: this.authContext,
        spaceAuthContext: this.spaceContext
      });
    },
    isUpdated: function (tokenLookup, space) {
      return this._tokenLookup && this._space &&
             this._tokenLookup === tokenLookup &&
             this._space === space;
    }
  };

  return new Authorization();
}]);
