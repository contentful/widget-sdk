'use strict';

angular.module('contentful').service('tokenStore', ['$injector', function($injector) {
  var $rootScope     = $injector.get('$rootScope');
  var $q             = $injector.get('$q');
  var client         = $injector.get('client');
  var authentication = $injector.get('authentication');
  var modalDialog    = $injector.get('modalDialog');
  var notifyReload   = $injector.get('ReloadNotification').trigger;

  var tokenStore = this;

  tokenStore._currentToken = null;
  tokenStore._inFlightUpdate = null;

  tokenStore.hasToken = function () {
    return !!tokenStore._currentToken;
  };

  tokenStore.updateToken = function(token) {
    tokenStore._currentToken = token;
  };

  tokenStore.updateTokenFromTokenLookup = function(tokenLookup) {
    var existingSpaces = tokenStore._currentToken ? tokenStore._currentToken.spaces : [];
    tokenStore.updateToken({
      user: tokenLookup.sys.createdBy,
      spaces: updateSpaces(tokenLookup.spaces, existingSpaces)
    });
  };

  tokenStore.getToken = function() {
    return tokenStore._currentToken;
  };

  tokenStore.getUpdatedToken = function() {
    if(tokenStore._inFlightUpdate)
      return tokenStore._inFlightUpdate;

    tokenStore._inFlightUpdate = authentication.getTokenLookup()
    .then(function (tokenLookup) {
      tokenStore.updateTokenFromTokenLookup(tokenLookup);
      tokenStore._inFlightUpdate = null;
      return tokenStore._currentToken;
    })
    .catch(tokenErrorHandler);
    return tokenStore._inFlightUpdate;
  };

  tokenStore.getSpaces = createTokenPropertyGetter('spaces', []);
  tokenStore.getUser = createTokenPropertyGetter('user', {});

  tokenStore.getSpace = function (id) {
    if(tokenStore._inFlightUpdate){
      return tokenStore._inFlightUpdate.then(function () {
        return getLoadedSpace(id);
      });
    } else {
      return $q.when(getLoadedSpace(id));
    }
  };

  function createTokenPropertyGetter(property, defaultValue) {
    return function () {
      if(tokenStore._inFlightUpdate)
        return tokenStore._inFlightUpdate.then(function () {
          return tokenStore._currentToken[property];
        });
      else
        return $q.when(tokenStore._currentToken ? tokenStore._currentToken[property] : defaultValue);
    };
  }

  function updateSpaces(rawSpaces, existingSpaces) {
    var newSpaceList = _.map(rawSpaces, function (rawSpace) {
      var existing = getSpaceFromList(rawSpace.sys.id, existingSpaces);
      if (existing) {
        existing.update(rawSpace);
        return existing;
      } else {
        var space = client.newSpace(rawSpace);
        space.save = function () { throw new Error('Saving space not allowed'); };
        return space;
      }
    });
    newSpaceList.sort(function (a,b) {
      return a.data.name.localeCompare(b.data.name);
    });
    return newSpaceList;
  }

  function getLoadedSpace(id) {
    var space = getSpaceFromList(id, tokenStore._currentToken.spaces);
    if(space)
      return space;
    else
      return $q.reject(new Error('Space not found'));
  }

  function getSpaceFromList(id, existingSpaces) {
    return _.find(existingSpaces, function (existingSpace) {
      return existingSpace.getId() === id;
    });
  }

  function tokenErrorHandler(err) {
    if (err && err.statusCode === 401) {
      modalDialog.open({
        title: 'Your login token is invalid',
        message: 'You need to login again to refresh your login token.',
        scope: $rootScope,
        cancelLabel: null,
        confirmLabel: 'Login',
        noBackgroundClose: true,
        attachTo: 'body'
      }).promise.then(function () {
        authentication.logout();
      });
    } else {
      notifyReload('The browser was unable to obtain the login token.');
    }
    return $q.reject(err);
  }

}]);
