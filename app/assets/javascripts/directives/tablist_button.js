'use strict';

angular.module('contentful').directive('tablistButton', function(analytics) {
  return {
    template: JST.tablist_button(),
    restrict: 'C',
    link: function (scope, elem) {
      elem.find('.dropdown-toggle').click(function (event) {
        if ($(event.currentTarget).parent().hasClass('active')) {
          analytics.track('Clicked Add-Button', {
            currentSection: scope.spaceContext.tabList.currentSection(),
            currentViewType: scope.spaceContext.tabList.currentViewType()
          });
        }
      });

      scope.$on('newContentTypePublished', function (event, contentType) {
        var toggle = elem.find('.dropdown-toggle');
        toggle.tooltip({
          delay: {show: 100, hide: 100},
          trigger: 'manual',
          title: 'You can now create a '+contentType.data.name+' Entry',
          placement: 'right'
        });
        toggle.tooltip('show');
        toggle.one('click', remove);
        var timer = setTimeout(remove, 1000 * 6);

        function remove(){
          toggle.tooltip('destroy');
          clearTimeout(timer);
          toggle.off('click', remove);
          toggle = null;
        }
      });
    }
  };
});
