'use strict';

angular.module('contentful/directives').directive('dropdownBtn', function() {
  return {
    restrict: 'C',
    link: function(scope, element) {
      var isOpen = false;

      var open = function() {
        isOpen = true;
      };

      var close = function() {
        isOpen = false;
      };

      var toggle = function() {
        isOpen = !isOpen;
      };

      element.find('.dropdown-toggle').click(function(event) {
        event.preventDefault();
        scope.$apply(function() {
          toggle();
        });
      });

      var closeOtherDropdowns = function(event) {
        var targetParents = $(event.target).parents();
        var inside = targetParents.index(element) !== -1;
        var on     = event.target === element[0];
        var clickOutside = !inside && !on;

        var clickOnClose = inside && $(event.target).attr('dropdown-close') !== undefined;

        if (clickOutside || clickOnClose) scope.$apply(function() {
          close();
        });
      };

      scope.$watch(function dropDownIsOpenWatcher(){
        return isOpen;
      }, function(isOpen) {
        var button = element;
        var content = element.find('.dropdown-menu');
        if (isOpen) {
          button.addClass('active');
          content.show();
          $(document).on('click', closeOtherDropdowns);
        } else {
          button.removeClass('active');
          content.hide();
          $(document).off('click', closeOtherDropdowns);
        }
      });
    }
  };
});

