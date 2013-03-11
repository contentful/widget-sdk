angular.module('contentful/services').provider('authentication', function AuthenticationProvider() {
  /*global moment*/
  'use strict';

  var authApp  = '//lvh.me:3002/';

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

    redirectToLogin: function() {
      var params = $.param({
        response_type: 'token',
        client_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        redirect_uri: window.location.protocol + '//' + window.location.host + '/',
        scope: 'private_manage'
      });
      window.location = this.authApp + 'oauth/authorize?' + params;
    },

    getTokenLookup: function(callback) {
      var self= this;
      if (this.tokenLooukp) {
        _.defer(callback, this.tokenLooukp);
      } else {
        this.client.getTokenLookup(function (err, data) {
          if (err) {
            console.warn('Error during token lookup');
            self.logout();
          } else {
            self.tokenLookup = self.QueryLinkResolver.resolveQueryLinks(data)[0];
            self.auth = UserInterface.worf(self.tokenLookup);
            callback(self.tokenLookup);
          }
        });
      }
    }
  };

  this.$get = function(QueryLinkResolver, client){
    return new Authentication(authApp, client, QueryLinkResolver);
  };

});
