'use strict';

angular.module('contentful')
.directive('cfFileEditor', ['require', function (require) {
  var aviary = require('aviary');
  var Filestack = require('services/Filestack');
  var notification = require('notification');
  var stringUtils = require('stringUtils');

  var dropPaneMountCount = 0;

  // TODO use isolated scope.
  // This is not possible right now because the widget depends on a
  // few helper methods from the scope.
  return {
    restrict: 'E',
    require: '^cfWidgetApi',
    template: JST.cf_file_display(),
    link: function (scope, elem, _attrs, widgetApi) {
      var field = widgetApi.field;
      var deleteFile = setFile.bind(null, null);

      var dropPaneMountPoint = elem[0].querySelectorAll('.__filestack-drop-pane-mount')[0];
      if (dropPaneMountPoint) {
        dropPaneMountCount += 1;
        dropPaneMountPoint.id = '__filestack-drop-pane-mount-' + dropPaneMountCount;
        Filestack.makeDropPane({
          id: dropPaneMountPoint.id,
          onSuccess: setFile
        });
      }

      var removeUpdateListener = field.onValueChanged(function (file) {
        scope.file = file;
      });

      scope.$on('$destroy', removeUpdateListener);
      scope.$on('fileProcessingFailed', deleteFile);
      scope.$on('imageLoadState', function (_e, state) {
        scope.imageIsLoading = state === 'loading';
      });

      scope.selectFile = selectFile;
      scope.editWithFilestack = editWithFilestack;
      scope.editWithAviary = editWithAviary;
      scope.deleteFile = deleteFile;

      function selectFile () {
        Filestack.pick().then(setFile, function () {
          notification.error('An error occurred while uploading an asset.');
        });
      }

      function editWithFilestack () {
        var imageUrl = getImageUrl();
        if (imageUrl) {
          Filestack.editFile(imageUrl).then(setFile, function () {
            notification.error('An error occurred while editing an asset.');
          });
        } else {
          notification.error('The image editor has failed to load.');
        }
      }

      function editWithAviary () {
        var imageUrl = getImageUrl();
        if (!imageUrl) {
          notification.error('The image editor has failed to load.');
          return;
        }

        scope.loadingEditor = true;
        var preview = elem.find('[aviary-editor-preview]').get(0);
        preview.src = '';

        preview.onload = function () {
          aviary.createEditor({
            image: preview,
            url: imageUrl,
            onClose: function (params) {
              if (params && !params.saveWasClicked) {
                scope.$apply(function () {
                  scope.loadingEditor = false;
                });
              }
            }
          }).then(function (aviaryUrl) {
            return Filestack.store(aviaryUrl);
          }).then(function (filestackUrl) {
            return setFile({
              upload: filestackUrl,
              fileName: scope.file.fileName,
              contentType: scope.file.contentType
            });
          }).then(function () {
            scope.loadingEditor = false;
            aviary.close();
          }, function (err) {
            notification.error(err.message || 'An error occurred while editing an asset.');
            scope.loadingEditor = false;
            aviary.close();
          });
        };

        preview.src = imageUrl;
      }

      function getImageUrl () {
        var img = elem.find('.thumbnail').get(0);
        return img ? stringUtils.removeQueryString(img.src) : null;
      }

      function setFile (file) {
        scope.file = file;
        scope.$applyAsync();
        if (file) {
          return field.setValue(file)
          .then(function () {
            scope.$emit('fileUploaded', file, scope.locale);
            validate();
          }, validate);
        } else {
          return field.removeValue().then(validate, validate);
        }
      }

      function validate () {
        return scope.editorContext.validator.run();
      }
    }
  };
}]);
