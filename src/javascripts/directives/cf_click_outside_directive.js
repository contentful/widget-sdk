'use strict';

// Works like ng-click but instead evaluates the argument
// when the click is _outside_ of the element
//
// `cf-click-outside-ignore` - If there is another element, external to the target
// of this directive that should not trigger an event, pass it with this attribute
// `cf-click-outside-when` - If present, the click outside handler only fires when
// the condition in this attribute is true
angular.module('contentful').directive('cfClickOutside', ['$parse', '$document', ($parse, $document) => ({
  restrict: 'A',

  link: function(scope, element, attr) {
    var fn = $parse(attr.cfClickOutside);
    var ignored = $(attr.cfClickOutsideIgnore);

    $document.bind('click', clickOutsideHandler);
    element.bind('remove', () => {
      $document.unbind('click', clickOutsideHandler);
    });

    function elementShouldBeIgnored(target) {
      return _.some(ignored, el => el === target);
    }

    function clickOutsideHandler(event) {
      if(!scope.$eval(attr.cfClickOutsideWhen)) return;
      event.stopPropagation();
      var targetParents         = $(event.target).parents();
      var clickIsOutsideElement = targetParents.index(element) !== -1;
      var clickIsOnElement      = event.target === element[0];
      var clickOutsideHappened  = !clickIsOutsideElement && !clickIsOnElement && !elementShouldBeIgnored(event.target);

      if (clickOutsideHappened) scope.$apply(() => {
        fn(scope, {$event:event});
      });
    }

  }
})]);

