'use strict';

angular.module('contentful').directive('searchResultsPosition', function() {
  return {
    restrict: 'C',
    template: JST['search_results_position'],
    scope: {
      paginator: '='
    },
    link: function(scope, element) {
      scope.$watch('paginator.progress()', function(progress) {
        element.find('.fill').css({height: progress*100+'%'});
      });
      var numberController = element.find('input[type=number]').controller('ngModel');

      numberController.$parsers.push(function (viewValue) {
        return parseInt(viewValue)-1;
      });

      numberController.$formatters.push(function (modelValue) {
        return parseInt(modelValue)+1;
      });

    }
  };
});


