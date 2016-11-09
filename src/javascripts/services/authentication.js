'use strict';

angular.module('contentful')
.factory('authentication', ['$injector', function ($injector) {
  var Config = $injector.get('Config');
  var contentfulClient = $injector.get('libs/@contentful/client');
  var $location = $injector.get('$location');
  var $q = $injector.get('$q');
  var $window = $injector.get('$window');
  var $http = $injector.get('$http');
  var assert = $injector.get('assert');
  var notification = $injector.get('notification');
  var logger = $injector.get('logger');
  var TheStore = $injector.get('TheStore');
  var client = $injector.get('client');
  var deepFreeze = $injector.get('utils/DeepFreeze').deepFreeze;

  var QueryLinkResolver = contentfulClient.QueryLinkResolver;

  return {
    login: function () {
      var token = loadToken();

      if (token) {
        this.token = token;
        if ($location.search().already_authenticated) {
          notification.info('You are already signed in.');
        }
        var afterLoginPath = TheStore.get('redirect_after_login');
        if (afterLoginPath) {
          TheStore.remove('redirect_after_login');
          $location.path(afterLoginPath);
        }
      } else {
        if (/^\/(\w+)/.test($location.path())) {
          TheStore.set('redirect_after_login', $location.path());
        }
        this.redirectToLogin();
      }
    },

    clearAndLogin: function () {
      TheStore.remove('token');
      this.login();
    },

    logout: function () {
      TheStore.remove('token');
      var payload = $.param({token: this.token});
      return $http.post(Config.authUrl('oauth/revoke'), payload, {
        headers: {
          'Authorization': 'Bearer ' + this.token,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).finally(function () {
        $window.location = Config.authUrl('logout');
      });
    },

    goodbye: function () {
      TheStore.remove('token');
      $window.location = Config.websiteUrl('goodbye');
    },
    redirectToLogin: function () {
      this.redirectingToLogin = true;
      $window.location = Config.authUrl('oauth/authorize', {
        response_type: 'token',
        client_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        redirect_uri: $window.location.protocol + '//' + $window.location.host + '/',
        scope: 'content_management_manage'
      });
    },

    getTokenLookup: function () {
      if (this.redirectingToLogin) {
        return $q.defer().promise; // never resolved lol
      }
      var self = this;
      return client.getTokenLookup()
      .then(function (data) {
        // Data === undefined is in cases of notmodified
        if (data !== undefined) self.setTokenLookup(data);
        return self.tokenLookup;
      }, function (err) {
        var statusCode = dotty.get(err, 'statusCode');
        if (statusCode !== 502 && statusCode !== 401) {
          logger.logError('getTokenLookup failed', {error: err});
        }
        return $q.reject(err);
      });
    },

    getUser: function () {
      if (this.tokenLookup) {
        return this.tokenLookup.sys.createdBy;
      }
    },

    setTokenLookup: function (tokenLookup) {
      this._unresolvedTokenLookup = tokenLookup;
      tokenLookup = angular.copy(tokenLookup);
      this.tokenLookup = QueryLinkResolver.resolveQueryLinks(tokenLookup)[0];
      this.tokenInfo = makeTokenInfo(this.tokenLookup);
    },

    updateTokenLookup: function (unresolvedUpdate) {
      assert.truthy(unresolvedUpdate.items.length === 1, 'Expected the token update to have exactly one element');
      var tokenLookup = angular.copy(this._unresolvedTokenLookup);

      // merge includes
      _.each(unresolvedUpdate.includes, function (newArray, className) {
        if (!tokenLookup.includes[className]) {
          tokenLookup.includes[className] = newArray;
        } else {
          var existingArray = tokenLookup.includes[className];
          merge(existingArray, newArray);
        }
      });

      // Update space
      var existingSpaces = tokenLookup.items[0].spaces;
      var newSpaces = unresolvedUpdate.items[0].spaces;
      merge(existingSpaces, newSpaces);
      // We're skipping the other properties of the token,
      // since only the spaces array should have changed

      this.setTokenLookup(tokenLookup);

      function merge (list, newList) {
        _.each(newList, function (newEntity) {
          var index = _.findIndex(list, function (entity) {
            return entity.sys.id === newEntity.sys.id;
          });
          if (index >= 0) {
            list[index] = newEntity;
          } else {
            list.push(newEntity);
          }
        });
      }
    }
  };

  function extractToken (hash) {
    var match = hash.match(/access_token=(\w+)/);
    return !!match && match[1];
  }

  function loadToken () {
    var token = extractToken($location.hash());
    if (token) {
      $location.hash('');
      TheStore.set('token', token);
      return token;
    }

    token = TheStore.get('token');
    if (token) {
      return token;
    }

    return null;
  }

  // TODO move this into the OrganizationContext once this is
  // implemented in #1531
  function makeTokenInfo (token) {
    var domains = token && token.domains;
    var domainMap = _.transform(domains, function (domainMap, domain) {
      domainMap[domain.name] = domain.domain;
    }, {});
    return deepFreeze({
      domains: domainMap
    });
  }
}]);
