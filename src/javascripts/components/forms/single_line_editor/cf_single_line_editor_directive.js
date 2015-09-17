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

      var constraints = _(validations).pluck('size').filter().first() || {};
      var fieldType = dotty.get(scope, 'widget.field.type');
      if (fieldType === 'Symbol' && !_.isNumber(constraints.max)) {
        constraints.max = 256;
      }

      scope.constraints = constraints;
      scope.constraintsType = constraintsType(constraints);

      scope.$watch('fieldData.value', function (val) {
        scope.charCount = (val || '').length;
        if (scope.constraints && scope.constraints.max) {
          scope.charCountStatus = getCharCountStatus(scope.charCount, scope.constraints.max);
        }
      });
    }
  };

  function constraintsType (constraints) {
    if (_.isNumber(constraints.min) && _.isNumber(constraints.max)) {
      return 'min-max';
    } else if (_.isNumber(constraints.min)) {
      return 'min';
    } else if (_.isNumber(constraints.max)) {
      return 'max';
    } else {
      return '';
    }
  }
});
