'use strict';

angular
  .module('contentful')
  .directive('cfContentPreviewEditor', [
    () => ({
      template: JST.content_preview_editor(),
      restrict: 'E',
      controller: 'cfContentPreviewEditorController',
      scope: true
    })
  ])

  .controller('cfContentPreviewEditorController', [
    '$scope',
    'require',
    ($scope, require) => {
      const $q = require('$q');
      const $state = require('$state');
      const $stateParams = require('$stateParams');
      const spaceContext = require('spaceContext');
      const Command = require('command');
      const leaveConfirmator = require('navigation/confirmLeaveEditor');
      const contentPreview = require('contentPreview');
      const notification = require('notification');
      const logger = require('logger');
      const slugUtils = require('slug');
      const Analytics = require('analytics/Analytics.es6');

      // Fetch content types and preview environment
      const getPreviewEnvironment = contentPreview.get($stateParams.contentPreviewId);
      const contentTypes = spaceContext.publishedCTs.refreshBare();
      const promises = $scope.context.isNew
        ? [contentTypes]
        : [contentTypes, getPreviewEnvironment];

      $q.all(promises).then(handleSuccessResponse, redirectToList);

      $scope.$watch('previewEnvironment.name', name => {
        $scope.context.title = name || 'Untitled';
      });

      $scope.$watch('contentPreviewForm.$dirty', isDirty => {
        $scope.context.dirty = isDirty;
      });

      $scope.context.requestLeaveConfirmation = leaveConfirmator(save);

      $scope.save = Command.create(save, {
        disabled: function() {
          return !$scope.context.dirty;
        }
      });

      $scope.remove = Command.create(remove, {
        disabled: function() {
          return $scope.save.inProgress();
        }
      });

      $scope.slugify = text => slugUtils.slugify(text, 'en-US');

      function validate() {
        $scope.invalidFields = null;

        if (!$scope.previewEnvironment.name) {
          _.set($scope, 'invalidFields.errors.name', 'Please provide a name.');
          showMissingRequiredFieldNotification();
        }

        $scope.previewEnvironment.configs.forEach(validateConfig);

        return !_.get($scope, 'invalidFields.errors');
      }

      function getWarnings(config) {
        const warnings = [];
        const invalidFields = contentPreview.getInvalidFields(config.url, config.contentTypeFields);
        maybeAppendWarning(
          invalidFields.nonExistentFields,
          "Fields with the following IDs don't exist in the content type: "
        );
        maybeAppendWarning(
          invalidFields.invalidTypeFields,
          'Fields with the following IDs will be output as an object or array: '
        );
        return warnings;

        function maybeAppendWarning(fields, message) {
          if (fields.length) {
            warnings.push(message + fields.join(', '));
          }
        }
      }

      function validateConfig(config) {
        if (config.enabled && !config.url) {
          addCtError(config.contentType, 'Please provide a URL.');
        } else if (config.url && !contentPreview.urlFormatIsValid(config.url)) {
          addCtError(config.contentType, 'URL is invalid.');
        } else {
          const warnings = getWarnings(config);
          if (warnings.length) {
            addCtWarning(config.contentType, warnings);
          }
        }
      }

      function addCtError(contentType, message) {
        _.set($scope, 'invalidFields.errors.configs.' + contentType, message);
        showMissingRequiredFieldNotification();
      }

      function addCtWarning(contentType, message) {
        _.set($scope, 'invalidFields.warnings.configs.' + contentType, message);
      }

      function showMissingRequiredFieldNotification() {
        notification.error('Failed to save: please fill out all required fields.');
      }

      function handleSuccessResponse(responses) {
        const cts = responses[0];
        if ($scope.context.isNew) {
          contentPreview.canCreate().then(allowed => {
            if (allowed) {
              $scope.previewEnvironment = contentPreview.new(cts);
              $scope.context.ready = true;
            } else {
              redirectToList();
            }
          });
        } else {
          $scope.context.ready = true;
          const env = responses[1];
          if (env) {
            $scope.previewEnvironment = contentPreview.toInternal(env, cts);
            validate();
          } else {
            logger.logError("Preview environment doesn't exist");
          }
        }
      }

      function redirectToList() {
        $state.go('^.list');
      }

      function save() {
        if (!validate()) {
          return $q.reject();
        }
        const action = $scope.context.isNew ? 'create' : 'update';
        return contentPreview[action]($scope.previewEnvironment).then(
          env => {
            notification.success('Content preview "' + env.name + '" saved successfully');
            $scope.previewEnvironment.version = env.sys.version;
            $scope.contentPreviewForm.$setPristine();
            $scope.context.dirty = false;

            // redirect if it's new
            if ($scope.context.isNew) {
              $state.go('^.detail', { contentPreviewId: env.sys.id }, { reload: true });
            }

            if ($scope.context.isNew) {
              track('created', env, { isDiscoveryApp: false });
            } else {
              track('updated', env);
            }
          },
          err => {
            const defaultMessage = 'Could not save Preview Environment';
            const serverMessage = _.first(_.split(_.get(err, 'body.message'), '\n'));
            notification.error(serverMessage || defaultMessage);
          }
        );
      }

      function remove() {
        const env = $scope.previewEnvironment;

        return contentPreview.remove(env).then(
          () => {
            notification.success('Content preview was deleted successfully');
            $scope.context.dirty = false;
            track('deleted', { name: env.name, sys: { id: env.id } });
            return $state.go('^.list');
          },
          () => {
            notification.error('An error occurred');
          }
        );
      }

      function track(event, env, extraData) {
        Analytics.track(
          'content_preview:' + event,
          _.extend(
            {
              envName: env.name,
              envId: env.sys.id
            },
            extraData || {}
          )
        );
      }
    }
  ]);
