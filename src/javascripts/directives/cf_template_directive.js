'use strict';

/**
 * Render a Jade template.
 *
 * @example[html]
 *   <div cf-template="foo"><cf-template>
 *
 * The example above will compile the template 'foo' from the global
 * `JST` and appends it to the template tag.
 */
angular.module('contentful')
.directive('cfTemplate', function() {
  return {
    restrict: 'A',
    compile: function(elem, attrs) {
      var template = JST[attrs.cfTemplate]();
      elem.append(template);
    }
  };
});
