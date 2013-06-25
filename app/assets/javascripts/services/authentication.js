angular.module('contentful').provider('authentication', function AuthenticationProvider(environment, contentfulClient) {
  /*global moment*/
  'use strict';

  var authApp  = '//'+environment.settings.base_host+'/';
  var QueryLinkResolver = contentfulClient.QueryLinkResolver;

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

      if (token = this.extractToken(document.location.hash)) {
        window.location.hash='';
        //history.pushState('', document.title, window.location.pathname+window.location.search);
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
      return authApp + 'profile/user?access_token='+this.token;
    },

    supportUrl: function() {
      return authApp + 'integrations/zendesk/login';
    },

    spaceSettingsUrl: function (spaceId) {
      return authApp + 'settings/spaces/'+spaceId+'/edit?access_token='+this.token;
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

    getTokenLookup: function(callback) {
      if (this.redirectingToLogin) {
        console.log('redirection to login in process during getTokenLookup. Not executing');
        return;
      }
      var self= this;
      if (this.tokenLooukp) {
        _.defer(callback, this.tokenLooukp);
      } else {
        this.client.getTokenLookup(function (err, data) {
          if (err) {
            console.warn('Error during token lookup', err, data);
            if (environment.env === 'development') {
              if (window.confirm('Error during token lookup, logout?')) self.logout();
            } else {
              self.logout();
            }
          } else {
            self.setTokenLookup(data);
            callback(self.tokenLookup);
          }
        });
      }
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

  this.$get = function(client){
    return new Authentication(client);
  };

});
