'use strict';

/**
 * Translate between the settings of the `assetImageDimension`
 * validation and the editing interface presented to the user.
 *
 * One controller instance only takes care of one dimension, either
 * 'width' or 'height'. The name of the dimension must be given by the
 * `dimension` property of the scope.
 *
 * Provides the following scope properties:
 *
 * - `condition`  One of 'min', 'min-max', 'max', 'exact'.
 * - `enabled`  Either `true` or `false`. Determines whether bounds
 *   for the 'height' or 'width' are enforced.
 * - `bounds.min`
 * - `bounds.max`
 * - `bounds.exact`
 */
angular.module('contentful').controller('ImageDimensionsValidationController', [
  '$scope',
  function($scope) {
    const controller = this;

    // Either 'width' or 'height';
    const dimension = $scope.dimension;

    loadValidationSettings();

    /**
     * Save the view data on the scope to the settings of the
     * `assetImageDimension` validation.
     */
    controller.update = function saveValidationSettings() {
      const settings = $scope.validation.settings[dimension];
      if (!$scope.enabled) {
        settings.min = null;
        settings.max = null;
        return;
      }

      const condition = $scope.condition;
      const bounds = $scope.bounds;
      if (condition === 'min') {
        settings.min = bounds.min;
        settings.max = null;
      } else if (condition === 'max') {
        settings.min = null;
        settings.max = bounds.max;
      } else if (condition === 'min-max') {
        settings.min = bounds.min;
        settings.max = bounds.max;
      } else if (condition === 'exact') {
        settings.min = bounds.exact;
        settings.max = bounds.exact;
      }
    };

    /**
     * Extract the bounds from the settings of the `assetImageDimension`
     * validation and populate the scope with the corresponding data.
     */
    function loadValidationSettings() {
      const bounds = $scope.validation.settings[dimension];
      const min = bounds.min;
      const max = bounds.max;

      $scope.condition = 'min';
      $scope.bounds = {};

      if (exists(min) || exists(max)) {
        $scope.enabled = true;
      } else {
        $scope.enabled = false;
        return;
      }

      if (min === max) {
        $scope.condition = 'exact';
        $scope.bounds.exact = min;
      } else if (exists(min) && exists(max)) {
        $scope.condition = 'min-max';
        $scope.bounds.min = min;
        $scope.bounds.max = max;
      } else if (exists(min)) {
        $scope.condition = 'min';
        $scope.bounds.min = min;
      } else if (exists(max)) {
        $scope.condition = 'max';
        $scope.bounds.max = max;
      }
    }

    /**
     * Return false if and only if the value is undefined or `null`.
     */
    function exists(value) {
      return typeof value !== 'undefined' && value !== null;
    }
  }
]);
