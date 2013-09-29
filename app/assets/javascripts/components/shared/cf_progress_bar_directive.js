'use strict';

angular.module('contentful').directive('cfProgressBar', function () {
  return {
    restrict: 'C',
    template: '<span></span>',
    link: function (scope, elem, attrs) {
      var bar = elem.children('span');

      function updateBarWidth(value){
        bar.width(value+'%');
      }

      if(elem.hasClass('animate')){
        bar.append('<span></span>');
      }

      scope.$watch('progressBarPercentage', updateBarWidth);
      updateBarWidth(attrs.percentage ? _.parseInt(attrs.percentage) : 0);
    }
  };
});
