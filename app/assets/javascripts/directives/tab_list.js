'use strict';

angular.module('contentful/directives').directive('tabList', function() {
  return {
    restrict: 'C',
    link: function(scope, element) {

      
      var settings = window.tabSettings = {
        tabMaxWidth: 0.215, //percent, matching up with nav-left
        tabBorder: 20,
        percentFactor: 0.95,
      };

      var recalc = function() {
        var total = element.prop('clientWidth');
        var numTabs;
        try {
          numTabs = scope.tabList.items.length;
        } catch(e) {
          return;
        }
        var addButtonWidth = element.find('.add-btn')[0].clientWidth+5;
        var addButtonPercentWidth = addButtonWidth/total*100;
        var spaceForTabs = total-addButtonWidth;

        if (settings.tabMaxWidth <= 1/numTabs) {
          element.find('.tab').css({width: ''});
        } else {
          var p = (100-addButtonPercentWidth)/numTabs;
          element.find('.tab').css({width: ''+p*settings.percentFactor+'%'});
        }
      };

      scope.$watch('tabList.items.length', function(numItems) {
        if (numItems > 0) recalc();
      });

      var debounceCalc = _.debounce(recalc, 200);

      $(window).on('resize', debounceCalc);

      scope.$on('$destroy', function() {
        $(window).off('resize', debounceCalc);
      });
    }
  };
});

