'use strict';

angular.module('contentful').provider('authentication', function AuthenticationProvider() {
  var authApp, marketingApp, QueryLinkResolver;

  var logger, environment, contentfulClient, $window, $location, $q, $rootScope, notification, assert;

  function setEnvVars($injector) {
    environment       = $injector.get('environment');
    contentfulClient  = $injector.get('privateContentfulClient');
    authApp           = '//'+environment.settings.base_host+'/';
    marketingApp      = environment.settings.marketing_url+'/';
    QueryLinkResolver = contentfulClient.QueryLinkResolver;
  }

  function Authentication(client){
    this.client = client;
  }

  var helper = {
    extractToken: function(hash) {
      var match = hash.match(/access_token=(\w+)/);
      return !!match && match[1];
    },

    loadToken: function() {
      /*jshint boss:true*/
      var token;

      if (token = this.extractToken($location.hash())) {
        $location.hash('');
        $.cookies.set('token', token, {
          expiresAt: moment().add(1, 'y').toDate()
        });
        return token;
      }

      if (token = $.cookies.get('token')) {
        return token;
      }

      return null;
    }
  };

  Authentication.prototype = {
    login: function() {
      var token = helper.loadToken();

      if (token) {
        this.token = token;
        if ($location.search().already_authenticated) {
          notification.info('You are already signed in.');
        }
        var afterLoginPath = $.cookies.get('redirect_after_login');
        if(afterLoginPath){
          $.cookies.del('redirect_after_login');
          $location.path(afterLoginPath);
        }
      } else {
        if(/^\/(\w+)/.test($location.path())){
          $.cookies.set('redirect_after_login', $location.path());
        }
        this.redirectToLogin();
      }
    },

    logout: function() {
      $.cookies.del('token');
      $window.location = authApp + 'logout';
    },

    goodbye: function () {
      $.cookies.del('token');
      $window.location = marketingApp + 'goodbye';
    },

    isLoggedIn: function() {
      return !!this.token;
    },

    accountUrl: function() {
      return authApp + 'account';
    },

    supportUrl: function() {
      return authApp + 'integrations/zendesk/login';
      // return 'http://support.contentful.com/';
    },

    spaceSettingsUrl: function (spaceId) {
      return authApp + 'settings/spaces/'+spaceId;
    },

    redirectToLogin: function() {
      var params = $.param({
        response_type: 'token',
        client_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        redirect_uri: $window.location.protocol + '//' + $window.location.host + '/',
        scope: 'content_management_manage'
      });
      this.redirectingToLogin = true;
      $window.location = authApp + 'oauth/authorize?' + params;
    },

    getTokenLookup: function() {
      if (this.redirectingToLogin) {
        return $q.defer().promise; // never resolved lol
      }
      var self = this;
      return this.client.getTokenLookup()
      .then(function (data) {
        // Data === undefined is in cases of notmodified
        if (data !== undefined) self.setTokenLookup(data);
        return self.tokenLookup;
      }, function (err) {
        var statusCode = dotty.get(err, 'statusCode');
        if(statusCode !== 502 && statusCode !== 401)
          logger.logError('getTokenLookup failed', { error: err });
        return $q.reject(err);
      });
    },

    getUser: function () {
      if (this.tokenLookup) return this.tokenLookup.sys.createdBy;
    },

    setTokenLookup: function (tokenLookup) {
      this._unresolvedTokenLookup = tokenLookup;
      tokenLookup = angular.copy(tokenLookup);
      this.tokenLookup = QueryLinkResolver.resolveQueryLinks(tokenLookup)[0];
    },

    updateTokenLookup: function(unresolvedUpdate){
      assert.truthy(unresolvedUpdate.items.length === 1, 'Expected the token update to have exactly one element');
      var tokenLookup = angular.copy(this._unresolvedTokenLookup);

      //merge includes
      _.each(unresolvedUpdate.includes, function(newArray, className){
        if (!tokenLookup.includes[className]) {
          tokenLookup.includes[className] = newArray;
        } else {
          var existingArray = tokenLookup.includes[className];
          merge(existingArray, newArray);
        }
      });

      // Update space
      var existingSpaces = tokenLookup.items[0].spaces;
      var newSpaces      = unresolvedUpdate.items[0].spaces;
      merge(existingSpaces, newSpaces);
      // We're skipping the other properties of the token,
      // since only the spaces array should have changed

      this.setTokenLookup(tokenLookup);

      function merge(list, newList) {
        _.each(newList, function(newEntity){
          var index = _.findIndex(list, function(entity){
            return entity.sys.id === newEntity.sys.id;
          });
          if (index >= 0) { list[index] = newEntity; }
          else            { list.push(newEntity); }
        });
      }
    }

  };

  this.$get = ['$injector', function($injector){
    $location    = $injector.get('$location');
    $q           = $injector.get('$q');
    $rootScope   = $injector.get('$rootScope');
    $window      = $injector.get('$window');
    assert       = $injector.get('assert');
    notification = $injector.get('notification');
    logger       = $injector.get('logger');
    var client   = $injector.get('client');

    var authentication = new Authentication(client);
    setEnvVars($injector);
    return authentication;
  }];

});
