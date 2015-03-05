'use strict';
angular.module('contentful').factory('totango', ['$injector', function($injector){
  var $window     = $injector.get('$window');
  var $q          = $injector.get('$q');
  var angularLoad = $injector.get('angularLoad');
  var CallBuffer  = $injector.get('CallBuffer');
  var environment = $injector.get('environment');

  var apiKey = dotty.get(environment, 'settings.totango');
  var SCRIPT_SRC = '//s3.amazonaws.com/totango-cdn/totango2.js';

  var loaderPromise;

  return {
    _buffer: new CallBuffer(),

    enable: function(){
      if (!loaderPromise) {
        $window.totango = {
          go: function(){return -1;},
          track: function(){},
          identify: function(){},
          setAccountAttributes: function(){}
        };

        $window.totango_options = {
          service_id: apiKey,
          allow_empty_accounts: false,
          account: {}
        };
        loaderPromise = angularLoad.loadScript(SCRIPT_SRC)
          .then(_.bind(this._buffer.resolve, this._buffer));
      }
      return loaderPromise;
    },

    disable: function(){
      loaderPromise = $q.reject();
      this._buffer.disable();
    },

    initialize: function(user, organization) {
      this._buffer.call(function(){
        if ($window.totango) {
          var orgId = organization ? organization.sys.id : 'noorg';
          $window.totango_options.username = user.sys.id +'-'+ orgId;
          $window.totango_options.account.id = orgId;
          $window.totango_options.module = $window.totango_options.module || 'Entries';
          $window.totango.go($window.totango_options);
        }
      });
    },

    setModule: function(module){
      this._buffer.call(function(){
        if($window.totango_options){
          $window.totango_options.module = module;
        }
      });
    },

    track: function(event) {
      this._buffer.call(function(){
        if ($window.totango){
          return $window.totango.track(event);
        }
      });
    }
  };

}]);
