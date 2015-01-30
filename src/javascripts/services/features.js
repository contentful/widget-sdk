'use strict';
angular.module('contentful').factory('features', ['$injector', function FeaturesFactory() {

  //var environment = $injector.get('environment');

  var featureChecks = {
    // Leaving this as a flag for now in case we need to turn it off quickly.
    spaceTemplates: function () { return true; },
    // TODO this is still not being used yet
    //layoutElements: function () { return environment.env !== 'production' && environment.env !== 'staging'; },
    //'interfaceEditor': interfaceEditor
  };

  function isEnabled(label) {
    if(label in featureChecks){
      return _.result(featureChecks, label);
    }
    return false;
  }

  return {
    isEnabled: isEnabled
  };
}]);
