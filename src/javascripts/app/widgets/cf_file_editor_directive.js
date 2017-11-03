'use strict';

angular.module('contentful')
.directive('cfFileEditor', ['require', function (require) {
  var aviary = require('aviary');
  var filepicker = require('filepicker');
  var logger = require('logger');
  var modalDialog = require('modalDialog');
  var notification = require('notification');
  var stringUtils = require('stringUtils');

  // TODO use isolated scope.
  // This is not possible right now because the widget depends on a
  // few helper methods from the scope.
  return {
    restrict: 'E',
    require: '^cfWidgetApi',
    template: JST.cf_file_display(),
    link: function (scope, elem, _attrs, widgetApi) {
      var field = widgetApi.field;

      scope.enableUpload = true;
      scope.showMeta = false;

      scope.$on('cfFileDropped', fileEventHandler);
      scope.$on('gettyFileAuthorized', fileEventHandler);
      scope.$on('fileProcessingFailed', deleteFile);

      var removeUpdateListener = field.onValueChanged(function (file) {
        scope.file = file;
      });


      scope.$on('$destroy', removeUpdateListener);

      scope.toggleMeta = toggleMeta;
      scope.uploadFile = uploadFile;
      scope.uploadFromGetty = uploadFromGetty;
      scope.editFile = editFile;
      scope.deleteFile = deleteFile;

      scope.$on('imageLoadState', function (_ev, state) {
        scope.imageIsLoading = state === 'loading';
      });

      function toggleMeta () {
        scope.showMeta = !scope.showMeta;
      }

      function uploadFile () {
        filepicker.pick()
        .then(function (FPFile) {
          setFPFile(FPFile);
        }, function (FPError) {
          // 101 means the user closed the dialog without picking a file
          if (FPError.code !== 101) {
            logger.logWarn('Error while picking file', {
              error: FPError
            });
          }
          scope.editorContext.validator.run();
        });
      }

      function uploadFromGetty () {
        modalDialog.open({
          scope: scope,
          template: 'getty_dialog'
        });
      }

      function deleteFile () {
        setFPFile(null).then(scope.editorContext.validator.run);
      }

      function fileEventHandler (_event, file) {
        setFPFile(file);
      }

      function setFPFile (fpFile) {
        aviary.close();
        var file = scope.file = filepicker.parseFPFile(fpFile);
        if (file) {
          return field.setValue(file)
          .then(function () {
            scope.$emit('fileUploaded', file, scope.locale);
          });
        } else {
          return field.removeValue();
        }
      }

      function editFile () {
        scope.loadingEditor = true;
        var img = elem.find('.thumbnail').get(0);
        if (!img) {
          notification.warn('The image editor has failed to load.');
          return;
        }
        var preview = elem.find('[aviary-editor-preview]').get(0);
        preview.src = '';
        var imgUrl = stringUtils.removeQueryString(img.src);
        var file = scope.file;
        preview.onload = function () {
          aviary.createEditor({
            file: file,
            image: preview,
            url: imgUrl,
            onClose: function (params) {
              if (params && !params.saveWasClicked) {
                scope.$apply(function () {
                  scope.loadingEditor = false;
                });
              }
            }
          }).then(function (FPFile) {
            setFPFile(FPFile);
            scope.loadingEditor = false;
          }).catch(function (err) {
            notification.error(err.message);
            logger.logError(err.message, {error: err.error});
            scope.loadingEditor = false;
            aviary.close();
          });
        };
        preview.src = imgUrl;
      }
    }
  };
}]);
