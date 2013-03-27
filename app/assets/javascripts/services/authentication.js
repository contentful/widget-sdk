angular.module('contentful/services').provider('authentication', function AuthenticationProvider(environmentProvider, worf) {
  /*global moment*/
  'use strict';

  var authApp  = '//'+environmentProvider.settings.base_host+'/';

  this.authApp= function(e) {
    authApp = e;
  };

  function Authentication(authApp, client, QueryLinkResolver){
    this.authApp = authApp;
    this.client = client;
    this.QueryLinkResolver = QueryLinkResolver;
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
      window.location = this.authApp + 'logout';
    },

    isLoggedIn: function() {
      return !!this.token;
    },

    profileUrl: function() {
      return this.authApp + 'profile/user/edit?access_token='+this.token;
    },

    bucketSettingsUrl: function (bucketId) {
      return this.authApp + 'settings/buckets/'+bucketId+'/edit?access_token='+this.token;
    },

    redirectToLogin: function() {
      var params = $.param({
        response_type: 'token',
        client_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        redirect_uri: window.location.protocol + '//' + window.location.host + '/',
        scope: 'private_manage'
      });
      this.redirectingToLogin = true;
      window.location = this.authApp + 'oauth/authorize?' + params;
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
            if (environmentProvider.env === 'development') {
              if (window.confirm('Error during token lookup, logout?')) self.logout();
            } else {
              self.logout();
            }
          } else {
            self.updateTokenLookup(data);
            callback(self.tokenLookup);
          }
        });
      }
    },

    updateTokenLookup: function (tokenLookup) {
      this.tokenLookup = this.QueryLinkResolver.resolveQueryLinks(tokenLookup)[0];
      this.auth = worf(this.tokenLookup);
    }

  };

  this.$get = function(QueryLinkResolver, client){
    return new Authentication(authApp, client, QueryLinkResolver);
  };

});
