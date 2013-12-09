'use strict';

angular.module('contentful').
  factory('authorization', function (worf) {
    function Authorization() {}

    Authorization.prototype = {
      authContext: null,
      spaceContext: null,
      setTokenLookup: function (tokenLookup, space) {
        this._tokenLookup = tokenLookup;
        this.authContext = worf(tokenLookup);
        this.setSpace(space);
      },
      setSpace: function (space) {
        this._space = space;
        if (space && this.authContext) {
          this.spaceContext = this.authContext.space(space.getId());
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
  }).
  factory('reasonsDenied', function (authorization) {
    return function reasonsDenied() {
      return authorization.spaceContext.reasonsDenied
        .apply(authorization.spaceContext, arguments);
    };
  });

