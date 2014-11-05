'use strict';

angular.module('contentful').directive('cfFileEditor', ['$injector', function ($injector) {
  var aviary       = $injector.get('aviary');
  var filepicker   = $injector.get('filepicker');
  var modalDialog  = $injector.get('modalDialog');
  var notification = $injector.get('notification');
  var stringUtils  = $injector.get('stringUtils');

  return {
    restrict: 'A',
    require: ['ngModel', '^otPath'],
    link: function (scope, elem) {
      scope.enableUpload = true;
      scope.showMeta = false;

      scope.toggleMeta = function () {
        scope.showMeta = !scope.showMeta;
      };

      scope.uploadFile = function () {
        filepicker.pick().
        then(function (FPFile) {
          setFPFile(FPFile);
        }, function (FPError) {
          if (FPError.code !== 101) {
            throw new Error(FPError);
          }
          scope.validate();
        });
      };

      scope.uploadFromGetty = function () {
        modalDialog.open({
          scope: scope,
          template: 'getty_dialog'
        });
      };

      scope.editFile = function () {
        scope.loadingEditor = true;
        var img = elem.find('.thumbnail').get(0);
        var preview = elem.find('.editor-preview').get(0);
        preview.src = '';
        var imgUrl = stringUtils.removeQueryString(img.src);
        preview.onload = function () {
          aviary.createEditor({
            file: scope.file,
            image: preview,
            url: imgUrl,
            onClose: function (params) {
              if(!params && params.saveWasClicked)
                scope.$apply(function () {
                  scope.loadingEditor = false;
                });
            }
          }).then(function (FPFile) {
            setFPFile(FPFile);
            scope.loadingEditor = false;
          }).catch(function (err) {
            notification.serverError(err.message, err.error);
            scope.loadingEditor = false;
            aviary.close();
          });
        };
        preview.src = imgUrl;
      };

      scope.deleteFile = function () {
        setFPFile(null);
        scope.validate();
      };

      scope.$on('cfFileDropped', fileEventHandler);
      scope.$on('gettyFileAuthorized', fileEventHandler);
      scope.$on('fileProcessingFailed', function () {
        setFPFile(null);
      });

      function fileEventHandler(event, file) {
        setFPFile(file);
      }

      function setFPFile(FPFile) {
        scope.file = filepicker.parseFPFile(FPFile);
        scope.otBindInternalChangeHandler().then(notify);
        aviary.close();
      }

      function notify() {
        // dependency on scope.locale feels weird
        if (scope.file) scope.$emit('fileUploaded', scope.file, scope.locale);
      }

    }
  };
}]);
