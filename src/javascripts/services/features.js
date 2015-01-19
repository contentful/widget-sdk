'use strict';
angular.module('contentful').factory('features', ['environment', function FeaturesFactory(environment) {

  var featureChecks = {
    spaceTemplates: function () { return dotty.exists(environment, 'settings.contentful') && environment.env !== 'production'; },
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
