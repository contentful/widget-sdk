'use strict';

angular.module('contentful').factory('tokenStore', ['$injector', function ($injector) {

  var $q                 = $injector.get('$q');
  var client             = $injector.get('client');
  var authentication     = $injector.get('authentication');
  var modalDialog        = $injector.get('modalDialog');
  var ReloadNotification = $injector.get('ReloadNotification');
  var logger             = $injector.get('logger');
  var createSignal       = $injector.get('signal');

  var currentToken = null;
  var changed  = createSignal();
  var refreshDeferred = null;
  var refreshRequests = 0;

  return {
    changed:           changed,
    refresh:           refresh,
    refreshWithLookup: refreshWithLookup,
    getSpaces:         getSpaces,
    getSpace:          getSpace
  };

  function refreshWithLookup(tokenLookup) {
    currentToken = {
      user: tokenLookup.sys.createdBy,
      spaces: updateSpaces(tokenLookup.spaces)
    };
    changed.dispatch(currentToken);
  }

  function refresh() {
    if (!refreshDeferred || refreshRequests < 1) {
      refreshRequests = 1;
      refreshDeferred = $q.defer();
      getNextTokenLookup();
    } else {
      refreshRequests += 1;
    }

    return refreshDeferred.promise;
  }

  function getNextTokenLookup() {
    authentication.getTokenLookup()
    .then(handleToken)
    .catch(handleTokenError);
  }

  function handleToken(token) {
    if (!refreshDeferred) {
      return $q.reject();
    }

    refreshRequests -= 1;
    if (refreshRequests > 0) {
      getNextTokenLookup();
    } else {
      refreshWithLookup(token);
      refreshDeferred.resolve();
      refreshDeferred = null;
    }
  }

  function handleTokenError(err) {
    refreshDeferred.reject(err);
    refreshDeferred = null;
    communicateError(err);
  }

  function getSpace(id) {
    return refreshDeferred ? refreshDeferred.promise.then(promiseSpace) : promiseSpace();

    function promiseSpace() {
      var space = findSpace(id);
      return space ? $q.when(space) : $q.reject(new Error('No space with given ID could be found.'));
    }
  }

  function getSpaces() {
    return refreshDeferred ? refreshDeferred.promise.then(promiseSpaces) : promiseSpaces();

    function promiseSpaces() {
      return $q.when(getCurrentSpaces());
    }
  }

  function updateSpaces(rawSpaces) {
    var updated = _.map(rawSpaces, updateSpace);
    updated.sort(getSorter(updated));
    return updated;
  }

  function updateSpace(rawSpace) {
    var existing = findSpace(rawSpace.sys.id);
    if (existing) {
      existing.update(rawSpace);
      return existing;
    } else {
      var space = client.newSpace(rawSpace);
      space.save = function () { throw new Error('Saving space is not allowed.'); };
      return space;
    }
  }

  function findSpace(id) {
    return _.find(getCurrentSpaces(), function (space) {
      return space.getId() === id;
    });
  }

  function getCurrentSpaces() {
    return currentToken ? currentToken.spaces : [];
  }

  function getSorter(spaces) {
    return function sortByName(a, b) {
      try {
        return a.data.name.localeCompare(b.data.name);
      } catch (e) {
        logger.logError('Space is not defined.', {
          data: {
            msg: e.message,
            exp: e,
            spaces: _.map(spaces, function (space) {
              return _.pluck(space, 'data');
            })
          }
        });
      }
    };
  }

  function communicateError(err) {
    if (err && err.statusCode === 401) {
      modalDialog.open({
        title: 'Your login token is invalid',
        message: 'You need to login again to refresh your login token.',
        cancelLabel: null,
        confirmLabel: 'Login',
        backgroundClose: false,
        disableTopCloseButton: true,
        ignoreEsc: true,
        attachTo: 'body'
      }).promise.then(function () {
        authentication.clearAndLogin();
      });
    } else {
      ReloadNotification.trigger('The browser was unable to obtain the login token.');
    }

    return $q.reject(err);
  }

}]);
