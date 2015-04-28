'use strict';
/**
 * Provides tracking for the usage of the commercial fonts acquired from fonts.com
 */
angular.module('contentful').factory('fontsdotcom', ['$injector', function($injector){
  var $document = $injector.get('$document');

  var PROJECT_ID = 'c54b0359-6164-4243-960a-5105a2c3bfa4';
  var enabled;

  return {
    enable: function(){
      if(!enabled){
        enabled = true;
        install();
      }
    }

  };

  // based on http://fast.fonts.net/t/trackingCode.js
  function install(){
    var document = $document[0];
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel  = 'stylesheet';
    link.href = '//fast.fonts.net/t/1.css?apiType=css&projectid=' + PROJECT_ID;

    // Insert our link next to the first script element.
    var first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(link, first);
  }
}]);
