'use strict';

angular.module('contentful').directive('entryTypeDescription', function () {
  return {
    restrict: 'C',
    template: JST['entry_type_description']()
  };
});
