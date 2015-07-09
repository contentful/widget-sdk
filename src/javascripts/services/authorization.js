'use strict';

angular.module('contentful').
  factory('authorization', ['worf', 'logger', function (worf, logger) {
    function Authorization() {}

    Authorization.prototype = {
      authContext: null,
      spaceContext: null,
      setTokenLookup: function (tokenLookup, space) {
        this._tokenLookup = tokenLookup;
        try {
          this.authContext = worf(tokenLookup);
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
          } catch(exp) {
            logger.logError('Worf authContext space exception', exp);
          }
        } else {
          this.spaceContext = null;
        }
      },
      isUpdated: function (tokenLookup, space) {
        return this._tokenLookup && this._space &&
               this._tokenLookup === tokenLookup &&
               this._space === space;
      }
    };

    return new Authorization();
  }]).
  factory('reasonsDenied', ['authorization', function (authorization) {
    return function reasonsDenied() {
      return authorization.spaceContext.reasonsDenied
        .apply(authorization.spaceContext, arguments);
    };
  }]);

