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
  factory('can', function (authorization, determineEnforcement) {
    return function can() {
      if (authorization.spaceContext){
        var args = Array.prototype.slice.call(arguments);
        var scope = args.shift();
        var response = authorization.spaceContext.can.apply(authorization.spaceContext, args);

        if(_.isArray(response)){
          var enforcement = determineEnforcement(response);
          if(enforcement){
            scope.persistentNotification = {
              message: enforcement.message,
              tooltipMessage: enforcement.description
            };
            scope.canReasons = enforcement;
          }
        } else if(response){
          return true;
        }
      }
      return false;
    };
  });
