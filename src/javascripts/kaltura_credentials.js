'use strict';

angular.module('contentful').service('kalturaCredentials', ['require', function(require){
  var $q     = require('$q');
  var client = require('client');
  var moment = require('moment');

  var credentialsCache = {
    credentials : undefined,
    store: function(c) {
      // Substract 10 seconds to ensure that we request the credentials before they actually expire.
      // Simple way to avoid clock discrepancies
      this.credentials = _.extend(c, {expiry_time: moment().subtract(10, 's').add(c.expires_in, 's') });
    },

    get: function() {
      return this.credentials;
    },

    isEmpty: function() {
      return !this.credentials;
    },

    areExpired: function() {
      return moment(this.credentials.expiry_time).isBefore(moment());
    }
  };

  return {
    get: function(organizationId) {
      var deferred = $q.defer();

      if (credentialsCache.isEmpty() || credentialsCache.areExpired())
        this._fetch(organizationId, deferred);
      else
        deferred.resolve(credentialsCache.get());

      return deferred.promise;
    },

    _fetch: function(organizationId, deferred) {
      return client.getIntegrationToken(['kaltura', organizationId].join('/'))
        .then(function(credentials){
          credentialsCache.store(credentials);
          deferred.resolve(credentials);
        })
        .catch(function(){
          deferred.reject();
        });
    }
  };
}]);
