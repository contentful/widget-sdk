// TODO: Allow the flag values to be modified during the tests

import $q from '$q';

const FLAGS = {
  'feature-bv-2018-01-resources-api': false
};

angular.module('contentful/mocks')
.factory('mocks/utils/LaunchDarkly', [function () {
  const api = {};

  api.getCurrentVariation = function (flagName) {
    return $q.resolve(FLAGS[flagName]);
  };

  return api;
}]);
