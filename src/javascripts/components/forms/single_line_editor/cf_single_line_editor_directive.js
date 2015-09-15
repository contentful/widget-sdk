'use strict';

angular.module('contentful').directive('cfSingleLineEditor', function() {

  return {
    restrict: 'E',
    template: JST['cf_single_line_editor'](),
    link: function(scope) {
      var validations = dotty.get(scope, 'widget.field.validations', []);

      function getCharCountStatus(len, maxChars) {
        var charsLeft = maxChars - len;

        if (charsLeft < 0) {
          return 'exceeded';
        } else if (charsLeft > -1 && charsLeft < 10) {
          return 'approaching';
        }
      }

      scope.constraints = _(validations).pluck('size').filter().first();

      var fieldType = dotty.get(scope, 'widget.field.type');
      if (fieldType === 'Symbol') {
        scope.constraints = _.defaults(scope.constraints || {}, {max: 256});
      }

      scope.$watch('fieldData.value', function (val) {
        scope.charCount = (val || '').length;
        if (scope.constraints && scope.constraints.max) {
          scope.charCountStatus = getCharCountStatus(scope.charCount, scope.constraints.max);
        }
      });
    }
  };
});
