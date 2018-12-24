import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';

registerDirective('cfEditorCharacterInfo', () => {
  // If the character count is less than this number of charachters
  // away from the constraint we set the state to 'approaching'
  const CLOSE_TO_CONSTRAINT = 10;

  return {
    scope: {
      constraints: '=',
      charCount: '=',
      wordCount: '='
    },
    restrict: 'E',
    template: JST.cf_editor_character_info(),
    link: function($scope) {
      $scope.$watch('constraints', constraints => {
        $scope.constraintsType = constraintsType(constraints);
      });

      $scope.$watch('wordCount', wordCount => {
        $scope.hasWordCount = _.isNumber(wordCount);
      });

      $scope.$watch('charCount', count => {
        if ($scope.constraints && $scope.constraints.max) {
          $scope.charCountStatus = getCharCountStatus(count, $scope.constraints.max);
        }
      });
    }
  };

  function getCharCountStatus(len, maxChars) {
    if (!maxChars) {
      return;
    }

    const charsLeft = maxChars - len;

    if (charsLeft < 0) {
      return 'exceeded';
    } else if (charsLeft > -1 && charsLeft < CLOSE_TO_CONSTRAINT) {
      return 'approaching';
    }
  }

  function constraintsType(constraints) {
    if (!constraints) {
      return;
    } else if (_.isNumber(constraints.min) && _.isNumber(constraints.max)) {
      return 'min-max';
    } else if (_.isNumber(constraints.min)) {
      return 'min';
    } else if (_.isNumber(constraints.max)) {
      return 'max';
    }
  }
});
