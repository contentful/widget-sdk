'use strict';

angular.module('contentful')
.directive('cfFileEditor', ['require', function (require) {
  var _ = require('lodash');
  var Filestack = require('services/Filestack');
  var ImageOperations = require('app/widgets/ImageOperations');
  var notification = require('notification');
  var stringUtils = require('stringUtils');
  var mimetype = require('mimetype');

  var dropPaneMountCount = 0;

  // TODO use isolated scope for this editor.
  // Ideally everything we do in here should be possible via `widgetApi`.
  // Right now we rely on parent scope properties like:
  // `editorData`, `editorContext`, `fieldLocale`, `locale`, `otDoc`
  return {
    restrict: 'E',
    require: '^cfWidgetApi',
    template: JST.cf_file_editor(),
    link: function (scope, elem, _attrs, widgetApi) {
      var field = widgetApi.field;
      var deleteFile = scope.deleteFile = setFile.bind(null, null);

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
        validate();
      });
      scope.$on('$destroy', removeUpdateListener);

      scope.$on('imageLoadState', function (_e, state) {
        scope.imageIsLoading = state === 'loading';
      });

      scope.selectFile = function selectFile () {
        Filestack.pick().then(setFile, function () {
          notification.error('An error occurred while uploading your asset.');
        });
      };

      scope.rotateOrMirror = function rotateOrMirror (mode) {
        scope.imageIsLoading = true;
        ImageOperations.rotateOrMirror(mode, scope.file).then(setUpload, function (err) {
          scope.imageIsLoading = false;
          notifyEditError(err);
        });
      };

      scope.resize = function resize (mode) {
        ImageOperations.resize(mode, scope.file).then(setUpload, notifyEditError);
      };

      scope.crop = function crop (mode) {
        // Cropping to a circle converts to PNG. Instead of updating only
        // the upload URL we need to update the whole file to include new
        // file name and MIME type.
        ImageOperations.crop(mode, scope.file).then(setFile, notifyEditError);
      };

      scope.canEditFile = function canEditFile () {
        var isEditable = _.get(scope, 'fieldLocale.access.editable', false);
        var fileType = _.get(scope, 'file.contentType', '');
        var isImage = mimetype.getGroupLabel({type: fileType}) === 'image';
        var isReady = !scope.imageIsLoading && _.get(scope, 'file.url');
        return isEditable && isImage && isReady;
      };

      function notifyEditError (err) {
        if (!err || !err.cancelled) {
          notification.error('An error occurred while editing your asset.');
        }
      }

      function setUpload (uploadUrl) {
        return setFile({
          upload: uploadUrl,
          fileName: scope.file.fileName,
          contentType: scope.file.contentType
        });
      }

      function setFile (file) {
        scope.file = file;
        scope.$applyAsync();
        if (file) {
          return field.setValue(file)
          .then(function () {
            maybeSetTitleOnDoc();
            process();
            validate();
          }, validate);
        } else {
          return field.removeValue().then(validate, validate);
        }
      }

      function maybeSetTitleOnDoc () {
        const path = ['fields', 'title', scope.locale.internal_code];
        const fileName = stringUtils.fileNameToTitle(scope.file.fileName);
        if (!scope.otDoc.getValueAt(path)) {
          scope.otDoc.setValueAt(path, fileName);
        }
      }

      function process () {
        scope.editorData.entity.process(scope.otDoc.getVersion(), scope.locale.internal_code)
        .catch(function (err) {
          deleteFile();

          const errors = _.get(err, ['body', 'details', 'errors'], []);
          const invalidContentTypeErr = _.find(errors, {name: 'invalidContentType'});

          if (invalidContentTypeErr) {
            notification.error(invalidContentTypeErr.details);
          } else {
            notification.error('An error occurred while processing your asset.');
          }
        });
      }

      function validate () {
        return scope.editorContext.validator.run();
      }
    }
  };
}]);
