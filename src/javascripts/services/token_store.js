'use strict';

/**
 * @ngdoc service
 * @name tokenStore
 *
 * @description
 * This service is responsible for exposing data included in the user's token
 */
angular.module('contentful')
.factory('tokenStore', ['require', function (require) {

  var $q = require('$q');
  var K = require('utils/kefir');
  var client = require('client');
  var authentication = require('authentication');
  var tokenLookup = require('tokenStore/lookup');
  var ReloadNotification = require('ReloadNotification');
  var logger = require('logger');
  var createQueue = require('overridingRequestQueue');

  var currentToken = null;

  var fetchLookupToken = createQueue(function (accessToken) {
    return tokenLookup.fetch(accessToken);
  }, function (promise) {
    promise.then(function (lookup) {
      refreshWithLookup(lookup);
      return lookup;
    }, function () {
      ReloadNotification.trigger('The browser was unable to obtain the login token.');
    });
  });

  var refreshPromise = $q.resolve();

  var userBus = K.createPropertyBus(null);
  var spacesBus = K.createPropertyBus([]);

  return {
    refresh: refresh,
    getSpaces: getSpaces,
    getSpace: getSpace,
    getDomains: getDomains,
    getTokenLookup: function () { return tokenLookup.get() },
    /**
     * @ngdoc property
     * @name tokenStore#user$
     * @type {Property<Api.User>}
     * @description
     * The current user object from the token
     */
    user$: userBus.property.skipDuplicates(_.isEqual),
    /**
     * @ngdoc property
     * @name tokenStore#spaces$
     * @type {Property<Api.Spaces>}
     * @description
     * The list of spaces from the token
     */
    spaces$: spacesBus.property,
    /**
     * @ngdoc property
     * @name tokenStore#spacesByOrganization$
     * @type {Property<object>}
     * @description
     * The list of spaces from the token grouped by organization
     */
    spacesByOrganization$: spacesBus.property.map(function (spaces) {
      return _.groupBy(spaces || [], function (space) {
        return space.data.organization.sys.id;
      });
    })
  };

  /**
   * @ngdoc method
   * @name tokenStore#refreshWithLookup
   * @param {object} tokenLookup
   * @description
   * This (synchronous) method takes a token lookup object and:
   * - stores user
   * - stores updated spaces (existing space objects are updated, not recreated)
   * - notifies all subscribers of "user$" and "spaces$" properties
   */
  function refreshWithLookup (lookup) {
    currentToken = {
      user: lookup.sys.createdBy,
      spaces: updateSpaces(lookup.spaces)
    };
    userBus.set(currentToken.user);
    spacesBus.set(currentToken.spaces);
  }

  /**
   * @ngdoc method
   * @name tokenStore#refresh
   * @returns {Promise<void>}
   * @description
   * This method should be called when token data needs to be refreshed.
   *
   * For requesting data we're using a queue:
   * - subsequent calls are queued and performed one after another
   * - returned promise is resolved with a value of the last call!
   *
   * As defined in "setupLookupHandler":
   * On failure we call "ReloadNotification", what basically forces an user
   * to reload the app. On success we call "refreshWithLookup" (see docs above).
   */
  function refresh () {
    var accessToken = authentication.getToken();
    refreshPromise = fetchLookupToken(accessToken);
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
  function getSpace (id) {
    return refreshPromise.then(function () {
      var space = findSpace(id);
      return space || $q.reject(new Error('No space with given ID could be found.'));
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
  function getSpaces () {
    return refreshPromise.then(getCurrentSpaces);
  }

  /**
   * TODO docs
   */
  function getDomains () {
    var domains = tokenLookup.get().domains || [];
    return domains.reduce(function (map, value) {
      map[value.name] = value.domain;
      return map;
    }, {});
  }

  function updateSpaces (rawSpaces) {
    var updated = _.map(rawSpaces, updateSpace);
    updated.sort(getSorter(updated));
    return updated;
  }

  function updateSpace (rawSpace) {
    var existing = findSpace(rawSpace.sys.id);
    if (existing) {
      existing.update(rawSpace);
      return existing;
    } else {
      return client.newSpace(rawSpace);
    }
  }

  function findSpace (id) {
    return _.find(getCurrentSpaces(), function (space) {
      return space.getId() === id;
    });
  }

  function getCurrentSpaces () {
    return currentToken ? currentToken.spaces : [];
  }

  function getSorter (spaces) {
    return function sortByName (a, b) {
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
}]);
