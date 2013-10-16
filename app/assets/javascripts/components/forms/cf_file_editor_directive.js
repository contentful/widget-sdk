'use strict';

angular.module('contentful').directive('cfFileEditor', function (notification, filepicker, $parse) {
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

      scope.deleteFile = function () {
        changeHandler(null);
        scope.validate();
      };

      scope.$on('cfFileDropped', function (event, FPFile) {
        changeHandler(FPFile);
      });

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
        });
      }

    }
  };
});
