'use strict';

angular.module('contentful').directive('cfFileEditor', ['notification', 'filepicker', '$parse', 'aviary', 'modalDialog', 'stringUtils',
                                       function (notification, filepicker, $parse, aviary, modalDialog, stringUtils) {
  return {
    restrict: 'C',
    require: ['ngModel', '^otPath'],
    template: JST['cf_file_info'],
    controller: 'CfFileEditorCtrl',
    link: function (scope, elem, attr, controllers) {
      var ngModelCtrl = controllers[0];

      var ngModelGet = $parse(attr.ngModel),
          ngModelSet = ngModelGet.assign;

      scope.enableUpload = true;

      scope.showMeta = false;

      scope.toggleMeta = function () {
        scope.showMeta = !scope.showMeta;
      };

      ngModelCtrl.$render = function () {
        scope.file = ngModelCtrl.$viewValue;
      };

      scope.$on('otValueChanged', function(event, path, value){
        if (path === event.currentScope.otPath) {
          ngModelSet(event.currentScope, value);
        }
      });

      scope.uploadFile = function () {
        filepicker.pick().
        then(function (FPFile) {
          changeHandler(FPFile);
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
          template: 'getty_dialog',
          deactivateConfirmKey: true
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
            onClose: function () {
              scope.loadingEditor = false;
            }
          }).then(function (FPFile) {
            changeHandler(FPFile);
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
        changeHandler(null);
        scope.validate();
      };

      scope.$on('cfFileDropped', fileEventHandler);
      scope.$on('gettyFileAuthorized', fileEventHandler);

      function fileEventHandler(event, file) {
        changeHandler(file);
      }

      function changeHandler(FPFile) {
        var file = FPFile ? {
         upload: FPFile.url,
         fileName: FPFile.filename,
         contentType: FPFile.mimetype
        } : null;
        scope.otChangeValue(file, function (err) {
          if (!err) {
            scope.file = file;
            ngModelCtrl.$setViewValue(file);
          } else {
            notification.serverError('There has been a problem saving the file', err);
          }
          aviary.close();
        });
      }

    }
  };
}]);
