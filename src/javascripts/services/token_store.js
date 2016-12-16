'use strict';

/**
 * @ngdoc service
 * @name tokenStore
 *
 * @description
 * This service is responsible for fetching, storing and exposing
 * data included in an access token.
 */
angular.module('contentful')
.factory('tokenStore', ['require', function (require) {

  var $q = require('$q');
  var K = require('utils/kefir');
  var client = require('client');
  var authentication = require('authentication');
  var modalDialog = require('modalDialog');
  var ReloadNotification = require('ReloadNotification');
  var logger = require('logger');
  var createSignal = require('signal').create;
  var createQueue = require('overridingRequestQueue');

  var currentToken = null;
  var changed  = createSignal();
  var request = createQueue(getTokenLookup, setupLookupHandler);
  var refreshPromise = $q.resolve();

  var userBus = K.createPropertyBus(null);

  return {
    changed:           changed,
    refresh:           refresh,
    refreshWithLookup: refreshWithLookup,
    getSpaces:         getSpaces,
    getSpace:          getSpace,
    /**
     * @ngdoc property
     * @name tokenStore#user$
     * @type {Property<Api.User>}
     * @description
     * The current user object from the token
     */
    user$: userBus.property
  };

  function getTokenLookup() {
    return authentication.getTokenLookup();
  }

  function setupLookupHandler(promise) {
    promise.then(function (lookup) {
      refreshWithLookup(lookup);
    }, communicateError);
  }

  /**
   * @ngdoc method
   * @name tokenStore#refreshWithLookup
   * @param {object} tokenLookup
   * @description
   * This (synchronous) method takes a token lookup object and:
   * - stores user
   * - stores updated spaces (existing space objects are updated, not recreated)
   * - notifies all subscribers of "changed" signal
   */
  function refreshWithLookup(tokenLookup) {
    currentToken = {
      user: tokenLookup.sys.createdBy,
      spaces: updateSpaces(tokenLookup.spaces)
    };
    userBus.set(currentToken.user);
    changed.dispatch(currentToken);
  }

  /**
   * @ngdoc method
   * @name tokenStore#refreshWithLookup
   * @returns {Promise<void>}
   * @description
   * This method should be called when token data needs to be refreshed.
   *
   * For requesting data we're using a queue:
   * - subsequent calls are queued and performed one after another
   * - returned promise is resolved with a value of the last call!
   *
   * As defined in "setupLookupHandler":
   * On failure we call "communicateError", what basically forces an user
   * to reload the app. On success we call "refreshWithLookup" (see docs above).
   */
  function refresh() {
    refreshPromise = request();
    return refreshPromise;
  }

  /**
   * @ngdoc method
   * @name tokenStore#getSpace
   * @param {string} id
   * @returns {Promise<API.Space>}
   * @description
   * This method returns a promise of a single stored space
   * If some calls are in progress, we're waiting until these are done.
   * Promise is rejected if space with a provided ID couldn't be found.
   */
  function getSpace(id) {
    return refreshPromise.then(function () {
      var space = findSpace(id);
      return space ? space : $q.reject(new Error('No space with given ID could be found.'));
    });
  }

  /**
   * @ngdoc method
   * @name tokenStore#getSpaces
   * @returns {Promise<API.Space[]>}
   * @description
   * This method returns a promise of all stored spaces.
   * If some calls are in progress, we're waiting until these are done.
   */
  function getSpaces() {
    return refreshPromise.then(getCurrentSpaces);
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
      return client.newSpace(rawSpace);
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
              return _.map(space, 'data');
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
  }

}]);
