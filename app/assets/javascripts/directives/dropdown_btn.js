'use strict';

angular.module('contentful/directives').directive('dropdownBtn', function() {
  return {
    restrict: 'C',
    scope: {},
    transclude: true,
    controller: function($transclude, $element) {
      $transclude(function(clone) {
        $element.append(clone);
      });
    },
    link: function(scope, element) {
      scope.isOpen = false;

      scope.open = function() {
        this.isOpen = true;
      };

      scope.close = function() {
        this.isOpen = false;
      };

      scope.toggle = function() {
        this.isOpen = !this.isOpen;
      };

      element.find('.dropdown-toggle').click(function(event) {
        event.preventDefault();
        scope.$apply(function(scope) {
          scope.toggle();
        });
      });

      var clickToCloseHandler = function(event) {
        var targetParents = $(event.target).parents();
        var inside = targetParents.index(element) !== -1;
        var on     = event.target === element[0];
        var clickOutside = !inside && !on;

        var clickOnClose = inside && $(event.target).attr('dropdown-close') !== undefined;

        if (clickOutside || clickOnClose) scope.$apply(function(scope) {
          scope.close();
        });
      };

      scope.$watch('isOpen', function(isOpen) {
        var button = element;
        var content = element.find('.dropdown-menu');
        if (isOpen) {
          button.addClass('active');
          content.show();
          $(document).on('click', clickToCloseHandler);
        } else {
          button.removeClass('active');
          content.hide();
          $(document).off('click', clickToCloseHandler);
        }
      });
    }
  };
});

