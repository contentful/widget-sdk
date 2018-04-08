'use strict';

angular.module('contentful')
.directive('cfFileEditor', ['require', function (require) {
  var aviary = require('aviary');
  var Filestack = require('services/Filestack');
  var notification = require('notification');
  var stringUtils = require('stringUtils');
  var modalDialog = require('modalDialog');
  var mimetype = require('mimetype');

  var dropPaneMountCount = 0;

  // TODO use isolated scope.
  // This is not possible right now because the widget depends on a
  // few helper methods from the scope.
  return {
    restrict: 'E',
    require: '^cfWidgetApi',
    template: JST.cf_file_editor(),
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
      scope.canEditFile = canEditFile;
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
        modalDialog.openConfirmDialog({
          title: 'Adobe Creative Editor is deprecated',
          message: 'Adobe Creative Editor will be discontinued soon. You can still use it but we suggest to use the "Edit image" option.',
          confirmLabel: 'I want to use Adobe Creative Editor',
          cancelLabel: 'I\'ll use the new editor'
        }).then(function (result) {
          if (result.confirmed) {
            openAviary();
          }
        });
      }

      function canEditFile () {
        var isEditable = _.get(scope, 'fieldLocale.access.editable', false);
        var fileType = _.get(scope, 'file.contentType', '');
        var isImage = mimetype.getGroupLabel({type: fileType}) === 'image';
        var isReady = !scope.imageIsLoading && _.get(scope, 'file.url');
        return isEditable && isImage && isReady;
      }

      function openAviary () {
        var imageUrl = getImageUrl();
        if (!imageUrl) {
          notification.error('The image editor has failed to load.');
          return;
        }

        var preview = elem[0].querySelectorAll('[aviary-editor-preview]')[0];
        preview.src = '';

        preview.onload = function () {
          aviary.createEditor({
            image: preview,
            url: imageUrl,
            onClose: _.noop
          }).then(function (aviaryUrl) {
            return Filestack.store(aviaryUrl);
          }).then(function (filestackUrl) {
            return setFile({
              upload: filestackUrl,
              fileName: scope.file.fileName,
              contentType: scope.file.contentType
            });
          }).then(function () {
            aviary.close();
          }, function (err) {
            notification.error(err.message || 'An error occurred while editing an asset.');
            aviary.close();
          });
        };

        preview.src = imageUrl;
      }

      function getImageUrl () {
        var img = elem[0].querySelectorAll('.thumbnail')[0];
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
