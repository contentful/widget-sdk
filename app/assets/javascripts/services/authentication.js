'use strict';

angular.module('contentful').provider('authentication', ['$injector', function AuthenticationProvider($injector) {
  var authApp, marketingApp, QueryLinkResolver;

  var environment, contentfulClient, $window, $location, $q, $rootScope, notification, ReloadNotification;
  var sentry;

  this.setEnvVars = function() {
    environment       = $injector.get('environment');
    contentfulClient  = $injector.get('contentfulClient');
    authApp           = '//'+environment.settings.base_host+'/';
    marketingApp      = environment.settings.marketing_url+'/';
    QueryLinkResolver = contentfulClient.QueryLinkResolver;
  };

  this.authApp = function(e) {
    authApp = e;
  };

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
          expiresAt: moment().add('y', 1).toDate()
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
      var cb = $q.callback();
      this.client.getTokenLookup(cb);
      return cb.promise.then(function (data) {
        // Data === undefined is in cases of notmodified
        if (data !== undefined) self.setTokenLookup(data);
        return self.tokenLookup;
      }, function (err) {
        sentry.captureError('getTokenlookup failed', { data: err });
        return $q.reject(err);
      })
      .catch(ReloadNotification.apiErrorHandler);
    },

    getUser: function () {
      if (this.tokenLookup) return this.tokenLookup.sys.createdBy;
    },

    setTokenLookup: function (tokenLookup) {
      this._unresolvedTokenLookup = tokenLookup;
      tokenLookup = angular.copy(tokenLookup);
      this.tokenLookup = QueryLinkResolver.resolveQueryLinks(tokenLookup)[0];
    }

  };

  this.$get = ['$injector', function($injector){
    $location          = $injector.get('$location');
    $q                 = $injector.get('$q');
    $rootScope         = $injector.get('$rootScope');
    $window            = $injector.get('$window');
    notification       = $injector.get('notification');
    sentry             = $injector.get('sentry');
    ReloadNotification = $injector.get('ReloadNotification');
    var client         = $injector.get('client');

    var authentication = new Authentication(client);
    this.setEnvVars();
    return authentication;
  }];

}]);
