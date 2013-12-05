'use strict';

angular.module('contentful').
  factory('authorization', function (worf) {
    function Authorization() {}

    Authorization.prototype = {
      authContext: null,
      spaceContext: null,
      setTokenLookup: function (tokenLookup, space) {
        this.authContext = worf(tokenLookup);
        this.setSpace(space);
      },
      setSpace: function (space) {
        if (space && this.authContext) {
          this.spaceContext = this.authContext.space(space.getId());
        } else {
          this.spaceContext = null;
        }
      }
    };

    return new Authorization();
  }).
  factory('reasonsDenied', function (authorization, determineEnforcement) {
    return function reasonsDenied() {
      var reasons = authorization.spaceContext.reasonsDenied
        .apply(authorization.spaceContext, arguments);
      return determineEnforcement.determineEnforcement(reasons);
    };
  });

