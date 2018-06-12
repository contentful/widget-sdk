'use strict';

/**
 * @ngdoc directive
 * @name cfDropdownToggle
 *
 * @description
 * This directive should be applied to an element which toggles a `cfDropdownMenu`.
 * It emits a `dropdownToggle` event from the `$rootScope` which is listened to by
 * `cfDropdownMenu` directives. It takes an id with should be matched to a
 * `cfDropdownMenu`. See the `cfDropdownMenu` directive documentation for more
 * information and example usage.
 */
// TODO this directive is deprecated and should be removed once it is
// not used any more
angular.module('contentful').directive('cfDropdownToggle', ['$rootScope', $rootScope => ({
  restrict: 'A',

  link: function(scope, toggleElement, attrs) {
    var id = attrs.cfDropdownToggle;

    toggleElement.click(event => {
      if(!toggleElement.attr('disabled')){
        event.stopPropagation();
        event.preventDefault();
        scope.$apply(() => {
          $rootScope.$broadcast('dropdownToggle', id, toggleElement);
        });
      }
    });
  }
})]);

