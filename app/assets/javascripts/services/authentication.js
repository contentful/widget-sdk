angular.module('contentful').provider('authentication', function AuthenticationProvider(environment, contentfulClient) {
  /*global moment*/
  'use strict';

  var authApp  = '//'+environment.settings.base_host+'/';
  var QueryLinkResolver = contentfulClient.QueryLinkResolver;
  var $location, $q, $rootScope;
  var sentry;

  this.authApp= function(e) {
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
      } else {
        this.redirectToLogin();
      }
    },

    logout: function() {
      $.cookies.del('token');
      window.location = authApp + 'logout';
    },

    isLoggedIn: function() {
      return !!this.token;
    },

    profileUrl: function() {
      return authApp + 'profile';
    },

    supportUrl: function() {
      //return authApp + 'integrations/zendesk/login';
      return 'http://support.contentful.com/';
    },

    spaceSettingsUrl: function (spaceId) {
      return authApp + 'settings/spaces/'+spaceId;
    },

    redirectToLogin: function() {
      var params = $.param({
        response_type: 'token',
        client_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        redirect_uri: window.location.protocol + '//' + window.location.host + '/',
        scope: 'content_management_manage'
      });
      this.redirectingToLogin = true;
      window.location = authApp + 'oauth/authorize?' + params;
    },

    getTokenLookup: function() {
      if (this.redirectingToLogin) {
        sentry.captureError('redirection to login in process during getTokenLookup. Not executing');
        return $q.reject();
      }
      var self = this;
      if (this.tokenLooukp) {
        return $q.when(this.tokenLookup);
      } else {
        var d = $q.defer();
        this.client.getTokenLookup(function (err, data) {
          if (err) {
            sentry.captureError('Error during token lookup', { data: { err: err } });
            self.logout();
          } else {
            $rootScope.$apply(function () {
              if (data !== undefined) { // Data === undefined is in cases of notmodified
                self.setTokenLookup(data);
              }
              d.resolve(self.tokenLookup);
            });
          }
        });
        return d.promise;
      }
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

  this.$get = function(client, _$location_, _sentry_, _$q_, _$rootScope_){
    $location = _$location_;
    sentry = _sentry_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    return new Authentication(client);
  };

});
