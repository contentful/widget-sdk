'use strict';

angular.module('contentful').directive('cfAddDropdownButton', ['analytics', function(analytics) {
  return {
    template: JST.cf_add_dropdown_button(),
    restrict: 'E',
    replace: true,
    link: function (scope, elem) {
      elem.find('[cf-dropdown-toggle]').click(function (event) {
        if ($(event.currentTarget).parent().hasClass('active')) {
          analytics.track('Clicked Add-Button', {
            currentState: scope.$state.current.name
          });
        }
      });

      scope.$on('contentTypePublished', function (event, contentType) {
        var toggle = elem.find('[cf-dropdown-toggle]');
        toggle.tooltip({
          delay: {show: 100, hide: 100},
          trigger: 'manual',
          title: 'You can now create a '+contentType.getName()+' Entry',
          placement: 'bottom'
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
}]);
