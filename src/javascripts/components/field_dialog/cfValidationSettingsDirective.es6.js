import { registerDirective } from 'NgRegistry.es6';
import mimetype from '@contentful/mimetype';

registerDirective('cfValidationSetting', [
  'validationViews',
  validationViews => ({
    scope: true,
    restrict: 'E',
    template: JST['cf_validation_settings'](),
    controller: [
      '$scope',
      $scope => {
        $scope.mimetypeGroups = mimetype.getGroupNames();

        $scope.$watch('validation.currentView', () => {
          validationViews.updateSettings($scope.validation);
        });

        $scope.setMatchingView = () => {
          $scope.validation.currentView = validationViews.getInitial($scope.validation);
        };
        $scope.setMatchingView();

        $scope.$watch('validation.enabled', isEnabled => {
          if (!isEnabled) {
            $scope.validate();
          }
        });
      }
    ]
  })
]);
