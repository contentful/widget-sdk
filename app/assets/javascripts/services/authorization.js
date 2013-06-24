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
        if (space) {
          this.spaceContext = this.authContext.space(space.getId());
        } else {
          this.spaceContext = null;
        }
      }
    };

    return new Authorization();
  }).
  factory('can', function (authorization) {
    return function can() {
      if (authorization.spaceContext)
        return authorization.spaceContext.can.apply(authorization.spaceContext, arguments);
      else
        console.warn('"can" missing spaceContext');
        return false;
    };
  });
