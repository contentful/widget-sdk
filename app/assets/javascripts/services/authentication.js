angular.module('contentful').provider('authentication', function AuthenticationProvider($injector) {
  'use strict';

  var authApp, marketingApp, QueryLinkResolver;

  var contentfulClient, $window, $location, $q, $rootScope, notification;
  var sentry;

  this.setEnvVars = function() {
    var environment = $injector.get('environment');
    contentfulClient = $injector.get('contentfulClient');
    authApp  = '//'+environment.settings.base_host+'/';
    marketingApp  = environment.settings.marketing_url+'/';
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
        sentry.captureError('redirection to login in process during getTokenLookup. Not executing');
        return $q.defer().promise; // never resolved lol
      }
      var self = this;
      var d = $q.defer();
      this.client.getTokenLookup(function (err, data) {
        $rootScope.$apply(function () {
          if (err) {
            d.reject(err);
          } else {
            if (data !== undefined) { // Data === undefined is in cases of notmodified
              self.setTokenLookup(data);
            }
            d.resolve(self.tokenLookup);
          }
        });
      });
      return d.promise;
    },

    getUser: function () {
      if (this.tokenLookup) return this.tokenLookup.sys.createdBy;
    },

    setTokenLookup: function (tokenLookup) {
      this._unresolvedTokenLookup = tokenLookup;
      tokenLookup = angular.copy(tokenLookup);
      this.tokenLookup = QueryLinkResolver.resolveQueryLinks(tokenLookup)[0];
    },

    updateTokenLookup: function (resource) {
      var resourceList = this._unresolvedTokenLookup.includes[resource.sys.type];
      var index = _.findIndex(resourceList, function (existingResource) {
        return existingResource.sys.id === resource.sys.id;
      });
      resourceList[index] = resource;
      this.setTokenLookup(this._unresolvedTokenLookup);
    }

  };

  this.$get = function(client, _$location_, _$window_, _sentry_, _$q_, _$rootScope_, _notification_){
    $location = _$location_;
    $window = _$window_;
    sentry = _sentry_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    notification = _notification_;
    var authentication = new Authentication(client);
    this.setEnvVars();
    return authentication;
  };

});
