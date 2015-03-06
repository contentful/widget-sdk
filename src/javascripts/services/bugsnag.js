'use strict';
angular.module('contentful').factory('bugsnag', ['$injector', function($injector){
  var $window    = $injector.get('$window');
  var CallBuffer = $injector.get('CallBuffer');

  var apiKey = 'b253f10d5d0184a99e1773cec7b726e8';
  var SCRIPT_SRC = '//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min.js';

  var loaderPromise;
  var bugsnag;

  return {
    _buffer: new CallBuffer(),

    enable: function(){
      if (!loaderPromise) {
        var angularLoad = $injector.get('angularLoad');
        var environment = $injector.get('environment');
        loaderPromise = angularLoad.loadScript(SCRIPT_SRC)
          .then(function(){
            bugsnag = $window.Bugsnag;//.noConflict();
            bugsnag.apiKey              = apiKey;
            bugsnag.notifyReleaseStages = ['staging', 'production'];
            bugsnag.releaseStage        = environment.env;
            bugsnag.appVersion          = environment.gitRevision;
            return bugsnag;
          })
          .then(_.bind(this._buffer.resolve, this._buffer));
        loaderPromise.catch(_.bind(this._buffer.disable, this._buffer));
      }
      return loaderPromise;
    },

    disable: function(){
      var $q = $injector.get('$q');
      loaderPromise = $q.reject();
      this._buffer.disable();
    },

    needsUser: function(){
      return Boolean(bugsnag && !bugsnag.user);
    },
    setUser: function(user){
      this._buffer.call(function(){
        if (bugsnag) bugsnag.user = user;
      });
    },
    notify: function(){
      var args = arguments;
      this._buffer.call(function(){
        if (bugsnag) bugsnag.notify.apply(bugsnag, args);
      });
    },
    notifyException: function(){
      var args = arguments;
      this._buffer.call(function(){
        if (bugsnag) bugsnag.notifyException.apply(bugsnag, args);
      });
    },
    refresh: function(){
      if (bugsnag) bugsnag.refresh();
    },
  };

}]);

