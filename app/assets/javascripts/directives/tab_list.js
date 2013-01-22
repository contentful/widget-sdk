'use strict';

angular.module('contentful/directives').directive('tabList', function() {
  return {
    restrict: 'C',
    link: function(scope, element) {

      
      var settings = window.tabSettings = {
        tabMaxWidth: 200,
        tabBorder: 50,
        percentFactor: 0.6,
      };

      var recalc = function() {
        var total = element.prop('clientWidth');
        var numTabs;
        try {
          numTabs = scope.tabList.items.length;
        } catch(e) {
          return;
        }
        var addButtonWidth = element.find('.add-btn')[0].clientWidth + 20;
        var addButtonPercentWidth = addButtonWidth/total*100;
        var spaceForTabs = total-addButtonWidth-20;
        console.log('recalc. totalWidth %o, numTabs %o, addButtonWidth %o %o, space remaining for tabs %o, space per tab %o', total, numTabs, addButtonWidth, addButtonPercentWidth, spaceForTabs, spaceForTabs/numTabs);

        if (settings.tabMaxWidth <= spaceForTabs/numTabs) {
          console.log('fixed');
          element.find('.tab').css({width: ''+(settings.tabMaxWidth-settings.tabBorder)+'px'});
        } else {
          console.log('relative');
          var p = (100-addButtonPercentWidth)/numTabs - 1;
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

