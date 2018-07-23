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
        this._environment = {
          sys: {
            id: environmentId,
            isMaster: environmentId === 'master'
          }
        };

        this.authContext = worf(this._tokenLookup, this._environment);
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
    setSpace: function (space, enforcements) {
      this._space = space;
      if (space && this.authContext) {
        try {
          if (enforcements) {
            const tokenSpace = this._tokenLookup.spaces.find(({sys}) => sys.id === space.getId());
            tokenSpace.enforcements = enforcements;
            this.authContext = worf(this._tokenLookup, this._environment);
          }
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
