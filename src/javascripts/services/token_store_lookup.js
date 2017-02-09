'use strict';

/**
 * @ngdoc service
 * @name tokenStore/lookup
 *
 * @description
 * This service is responsible for fetching, storing and exposing
 * the raw data included in the user's token
 */
angular.module('contentful')
.factory('tokenStore/lookup', ['require', function (require) {
  var $q = require('$q');
  var K = require('utils/kefir');
  var client = require('client');
  var ReloadNotification = require('ReloadNotification');
  var logger = require('logger');
  var contentfulClient = require('libs/@contentful/client');
  var QueryLinkResolver = contentfulClient.QueryLinkResolver;

  var tokenLookup;

  return {
    fetch: fetch,
    get: get,
  };

  /** TODO doc
   */
  function fetch (accessToken) {
    if (accessToken) {
      // todo replace with raw $http call
      client.init(accessToken);
      return client.getTokenLookup()
      .then(function (data) {
        // Data === undefined is in cases of 304 Not Modified
        if (data !== undefined) {
          set(data);
        }
        return tokenLookup;
      });
    } else {
      // The promise is never resolved if fetch() is called before a accessToken
      // is available. We don't want to display an error in this case.
      return $q.defer().promise;
    }
  }

  function get () {
    return tokenLookup;
  }

  function set (newLookup) {
    tokenLookup = QueryLinkResolver.resolveQueryLinks(_.cloneDeep(newLookup))[0];
    return tokenLookup;
  }
}]);
