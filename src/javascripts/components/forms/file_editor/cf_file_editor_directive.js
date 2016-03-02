'use strict';

angular.module('contentful').directive('cfFileEditor', ['$injector', function ($injector) {
  var aviary       = $injector.get('aviary');
  var filepicker   = $injector.get('filepicker');
  var logger       = $injector.get('logger');
  var modalDialog  = $injector.get('modalDialog');
  var notification = $injector.get('notification');
  var stringUtils  = $injector.get('stringUtils');

  return {
    restrict: 'A',
    require: ['ngModel', '^otPath'],
    controller: 'ThumbnailController',
    link: function (scope, elem) {
      scope.enableUpload = true;
      scope.showMeta = false;

      scope.$on('cfFileDropped', fileEventHandler);
      scope.$on('gettyFileAuthorized', fileEventHandler);
      scope.$on('fileProcessingFailed', function () {
        deleteFile();
      });

      scope.toggleMeta = toggleMeta;
      scope.uploadFile = uploadFile;
      scope.uploadFromGetty = uploadFromGetty;
      scope.editFile = editFile;
      scope.deleteFile = deleteFile;

      function toggleMeta() {
        scope.showMeta = !scope.showMeta;
      }

      function uploadFile() {
        filepicker.pick().
        then(function (FPFile) {
          setFPFile(FPFile);
        }, function (FPError) {
          if (FPError.code !== 101) {
            throw new Error(FPError);
          }
          scope.validate();
        });
      }

      function uploadFromGetty() {
        modalDialog.open({
          scope: scope,
          template: 'getty_dialog'
        });
      }

      function deleteFile() {
        setFPFile(null).then(scope.validate);
      }

      function fileEventHandler(event, file) {
        setFPFile(file);
      }

      function setFPFile(FPFile) {
        aviary.close();
        scope.file = filepicker.parseFPFile(FPFile);
        return scope.otBindObjectValueCommit().then(notify);
      }

      function notify() {
        if (scope.file) {
          scope.$emit('fileUploaded', scope.file, scope.locale);
        }
      }

      function editFile() {
        scope.loadingEditor = true;
        scope.imageHasLoaded = false;
        var img = elem.find('.thumbnail').get(0);
        if(!img) {
          notification.warn('The image editor has failed to load.');
          return;
        }
        var preview = elem.find('[aviary-editor-preview]').get(0);
        preview.src = '';
        var imgUrl = stringUtils.removeQueryString(img.src);
        preview.onload = function () {
          aviary.createEditor({
            file: scope.file,
            image: preview,
            url: imgUrl,
            onClose: function (params) {
              if(params && !params.saveWasClicked)
                scope.$apply(function () {
                  scope.loadingEditor = false;
                });
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
