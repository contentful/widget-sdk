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
  var createMVar = require('utils/Concurrent/MVar').default;
  var client = require('client');
  var auth = require('Authentication');
  var makeFetchWithAuth = require('data/CMA/TokenInfo').default;
  var ReloadNotification = require('ReloadNotification');
  var OrganizationList = require('services/OrganizationList');
  var presence = require('presence');
  var $window = require('$window');
  var deepFreezeClone = require('utils/DeepFreeze').deepFreezeClone;

  // Refresh token info every 5 minutes
  var TOKEN_INFO_REFRESH_INTERVAL = 5 * 60 * 1000;

  var fetchInfo = makeFetchWithAuth(auth);

  var userBus = K.createPropertyBus(null);
  var spacesBus = K.createPropertyBus([]);
  var organizationsBus = K.createPropertyBus([]);

  // MVar that holds the token data
  var tokenInfoMVar = createMVar(tokenInfo);
  // Variable storing the token data, so that it can be accessed synchronously.
  // @todo - remove it and use promise
  var tokenInfo = null;

  return {
    init: init,
    refresh: refresh,
    getSpace: getSpace,
    getSpaces: getSpaces,
    getDomains: getDomains,
    getOrganization: getOrganization,
    getOrganizations: getOrganizations,
    getTokenLookup: function () { return tokenInfo; },
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
     * @name tokenStore#spaces$
     * @type {Property<Api.Spaces>}
     * @description
     * The list of spaces from the token
     */
    organizations$: organizationsBus.property,
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
   * Start refreshing the token data every five minutes and every time
   * the access token changes.
   */
  function init () {
    var offToken = K.onValue(auth.token$, refresh);
    var refreshInterval = $window.setInterval(function () {
      if (presence.isActive()) {
        refresh();
      }
    }, TOKEN_INFO_REFRESH_INTERVAL);

    return function deinit () {
      $window.clearInterval(refreshInterval);
      offToken();
    };
  }

  /**
   * @ngdoc method
   * @name tokenStore#refresh
   * @returns {Promise<void>}
   * @description
   * Fetches data from the `/token` endpoint and updates the state of
   * the service with the reponse.
   *
   * Returns the response from the token endpoint.
   */
  function refresh () {
    if (!tokenInfoMVar.isEmpty()) {
      tokenInfoMVar.empty();
      fetchInfo().then(function (newTokenInfo) {
        tokenInfo = newTokenInfo;
        tokenInfoMVar.put(newTokenInfo);
        var user = newTokenInfo.sys.createdBy;
        var organizations = _.map(user.organizationMemberships, 'organization');
        spacesBus.set(updateSpaces(newTokenInfo.spaces));
        userBus.set(user);
        organizationsBus.set(organizations);
        OrganizationList.setUser(user);
        OrganizationList.setOrganizations(organizations);
      }, function () {
        ReloadNotification.trigger('The application was unable to authenticate with the server');
      });
    }
    return tokenInfoMVar.read();
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
   *
   * TODO only used by the space detail state. Find a better way
   */
  function getSpace (id) {
    return tokenInfoMVar.read().then(function () {
      var space = findSpace(id);
      return space || $q.reject(new Error('No space with given ID could be found.'));
    });
  }

  /**
   * @ngdoc method
   * @name tokenStore#getSpaces
   * @returns {Array[Promise<API.Space>]}
   * @description
   * This method returns a promise of the list of spaces.
   * If some calls are in progress, we're waiting until these are done.
   *
   */
  function getSpaces () {
    return tokenInfoMVar.read().then(function () {
      return K.getValue(spacesBus.property)
      .map(function (s) { return deepFreezeClone(s.data); });
    });
  }

  function getDomains () {
    var domains = _.get(tokenInfo, 'domains', []);
    return domains.reduce(function (map, value) {
      map[value.name] = value.domain;
      return map;
    }, {});
  }

  /**
   * @ngdoc method
   * @name tokenStore#getOrganization
   * @param {string} id
   * @returns {Promise<API.Organization>}
   * @description
   * This method returns a promise of a single stored organization
   * If some calls are in progress, we're waiting until these are done.
   * Promise is rejected if organization with a provided ID couldn't be found.
   */
  function getOrganization (id) {
    return getOrganizations().then(function (orgs) {
      var org = _.find(orgs, { sys: { id: id } });
      return org || $q.reject(new Error('No organization with given ID could be found.'));
    });
  }

  /**
   * @ngdoc method
   * @name tokenStore#getOrganizations
   * @returns {Array[Promise<API.Organization>]}
   * @description
   * This method returns a promise of the list of organizations.
   * If some calls are in progress, we're waiting until these are done.
   *
   */
  function getOrganizations () {
    return tokenInfoMVar.read().then(function () {
      return deepFreezeClone(K.getValue(organizationsBus.property));
    });
  }

  function updateSpaces (rawSpaces) {
    var updated = _.map(rawSpaces, updateSpace);
    updated.sort(sortByName);
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
    var spaces = K.getValue(spacesBus.property);
    return _.find(spaces, function (space) {
      return space.getId() === id;
    });
  }

  function sortByName (a, b) {
    var nameA = _.get(a, 'data.name', '');
    var nameB = _.get(b, 'data.name', '');
    return nameA.localeCompare(nameB);
  }
}]);
