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
    setTokenLookup: function (tokenLookup, space, environmentId) {
      this._tokenLookup = tokenLookup;
      try {
        var worfEnvironment = {
          sys: {
            id: environmentId,
            isMaster: environmentId === 'master'
          }
        };

        this.authContext = worf(tokenLookup, worfEnvironment);
      } catch (exp) {
        logger.logError('Worf initialization exception', {
          data: {
            exception: exp,
            tokenLookup: tokenLookup
          }
        });
      }
      this.setSpace(space);
    },
    setSpace: function (space) {
      this._space = space;
      if (space && this.authContext) {
        try {
          this.spaceContext = this.authContext.space(space.getId());
        } catch (exp) {
          logger.logError('Worf authContext space exception', exp);
        }
      } else {
        this.spaceContext = null;
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
