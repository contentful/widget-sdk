'use strict';

angular.module('contentful').factory('tokenStore', ['$injector', function ($injector) {

  var $rootScope         = $injector.get('$rootScope');
  var $q                 = $injector.get('$q');
  var client             = $injector.get('client');
  var authentication     = $injector.get('authentication');
  var modalDialog        = $injector.get('modalDialog');
  var ReloadNotification = $injector.get('ReloadNotification');
  var logger             = $injector.get('logger');
  var createSignal       = $injector.get('signal');

  var currentToken = null;
  var inFlightUpdate = null;
  var changed  = createSignal();

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
    if (inFlightUpdate) {
      return inFlightUpdate;
    }

    inFlightUpdate = authentication.getTokenLookup()
    .then(refreshWithLookup)
    .then(function () {
      inFlightUpdate = null;
    })
    .catch(tokenErrorHandler);

    return inFlightUpdate;
  }

  function getSpace(id) {
    return inFlightUpdate ? inFlightUpdate.then(promiseSpace) : promiseSpace();

    function promiseSpace() {
      var space = findSpace(id);
      return space ? $q.when(space) : $q.reject(new Error('No space with given ID could be found.'));
    }
  }

  function getSpaces() {
    return inFlightUpdate ? inFlightUpdate.then(promiseSpaces) : promiseSpaces();

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

  function tokenErrorHandler(err) {
    if (err && err.statusCode === 401) {
      modalDialog.open({
        title: 'Your login token is invalid',
        message: 'You need to login again to refresh your login token.',
        scope: $rootScope,
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
