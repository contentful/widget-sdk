angular.module('contentful/services').provider('authentication', function AuthenticationProvider() {
  /*global moment*/
  'use strict';

  var endpoint = '//api.lvh.me:3002/';

  this.endpoint = function(e) {
    endpoint = e;
  };

  function Authentication(endpoint){
    this.endpoint = endpoint;
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
      window.location = this.endpoint + 'logout';
    },

    isLoggedIn: function() {
      return !!this.token;
    },

    profileUrl: function() {
      return this.endpoint + 'profile/edit';
    },

    redirectToLogin: function() {
      var params = $.param({
        response_type: 'token',
        client_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        redirect_uri: window.location.protocol + '//' + window.location.host + '/',
        scope: 'private_manage'
      });
      window.location = this.endpoint + 'oauth/authorize?' + params;
    },

    getTokenLookup: function(callback) {
      var self= this;
      if (this.tokenLooukp) {
        _.defer(callback, this.tokenLooukp);
      } else {
        $.ajax(this.endpoint+'token', {
          headers: {
            'Authorization': 'Bearer ' + self.token,
            'Accept': 'application/vnd.contentful.v1+json'
          },
          dataType: 'json',
          success: function(data) {
            self.tokenLookup = data;
            callback(data);
          },
          error: function() {
            self.logout();
          }
        });
      }
    }
  };

  this.$get = function(){
    return new Authentication(endpoint);
  };

});
