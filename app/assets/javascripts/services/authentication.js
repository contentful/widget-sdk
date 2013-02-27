angular.module('contentful/services').provider('authentication', function AuthenticationProvider() {
  /*global unescape escape*/
  'use strict';

  var endpoint = '//api.lvh.me:3002/';

  this.endpoint = function(e) {
    endpoint = e;
  };

  function Authentication(endpoint){
    this.endpoint = endpoint;
  }

  var helper = {
    getCookie: function(c_name) {
      var i, x, y, ARRcookies = document.cookie.split(';');
      for (i=0; i<ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0,ARRcookies[i].indexOf('='));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf('=')+1);
        x = x.replace(/^\s+|\s+$/g,'');
        if (x == c_name) {
          return unescape(y);
        }
      }
    },

    setCookie: function(c_name,value,exdays) {
      // TODO replace with moment.js
      var exdate=new Date();
      exdate.setDate(exdate.getDate() + exdays);
      var c_value=escape(value) + ((exdays===null) ? '' : '; expires='+exdate.toUTCString());
      document.cookie=c_name + '=' + c_value;
    },

    deleteCookie: function(c_name) {
      document.cookie = c_name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    },

    extractToken: function(hash) {
      var match = hash.match(/access_token=(\w+)/);
      return !!match && match[1];
    },

    loadToken: function() {
      /*jshint boss:true*/
      var token;

      if (token = this.getCookie('token')) {
        return token;
      }

      if (token = this.extractToken(document.location.hash)) {
        window.location.replace("#");
        this.setCookie('token', token, 365);
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

    isLoggedIn: function() {
      return !!this.token;
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
            console.log('got token lookup', data);
          }
        });
      }
    }
  };

  this.$get = function(){
    return new Authentication(endpoint);
  };

});
