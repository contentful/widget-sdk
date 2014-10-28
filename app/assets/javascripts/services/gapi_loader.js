'use strict';
angular.module('contentful').factory('gapiLoader', ['$injector', function($injector){

  var googleScriptLoader = $injector.get('googleScriptLoader');

  var SCRIPT_SRC = 'https://apis.google.com/js/client.js?onload=OnLoadCallback';

  return {
    load : function(){
      return googleScriptLoader.load(SCRIPT_SRC, {name: 'OnLoadCallback'})
      .then(function(){
        return $injector.get('GAPIAdapter');
      });
    }
  };
}]);

