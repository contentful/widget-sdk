import { registerDirective } from 'NgRegistry';
import mimetype from '@contentful/mimetype';
import validationViews from 'services/validationViews';
import validationSettingsTemplate from './cf_validation_settings.html';

export default function register() {
  registerDirective('cfValidationSetting', [
    () => ({
      scope: true,
      restrict: 'E',
      template: validationSettingsTemplate,
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

          $scope.updateValidationSettingsValue = items => {
            $scope.validation.settings = items;
            $scope.validator.run();
            $scope.$applyAsync();
          };

          $scope.updateValidationCurrentView = currentView => {
            $scope.validation.currentView = currentView;
            $scope.validator.run();
            $scope.$applyAsync();
          };

          $scope.updateValidationMessageValue = value => {
            $scope.validation.message = value;
            $scope.validator.run();
            $scope.$applyAsync();
          };
        }
      ]
    })
  ]);
}
