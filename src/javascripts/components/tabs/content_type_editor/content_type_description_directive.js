'use strict';

angular.module('contentful').directive('contentTypeDescription', function () {
  return {
    restrict: 'C',
    template: JST['content_type_description']()
  };
});
