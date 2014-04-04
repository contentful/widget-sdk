'use strict';

angular.module('contentful').directive('cfFileEditor', function (notification, filepicker, $parse, aviary, environment) {
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

      scope.editFile = function () {
        var preview = elem.find('.thumbnail').get(0);
        var nonSecureUrl = preview.src.replace(/^https/g, 'http');
        var imgUrl = nonSecureUrl.replace(/(\.\w+)\?.*/, '$1');
        if(environment.env == 'staging'){
          preview.src = nonSecureUrl;
        }
        console.log('attempting to edit url', preview.src, imgUrl, nonSecureUrl);
        aviary.createEditor({
          file: scope.file,
          image: preview,
          url: imgUrl
        }).then(function (FPFile) {
          console.log('after edit', FPFile);
          changeHandler(FPFile);
        }).catch(function (FPError) {
          console.log(FPError);
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
        console.log('change handler', FPFile);
        var file = FPFile ? {
         upload: FPFile.url,
         fileName: FPFile.filename,
         contentType: FPFile.mimetype
        } : null;
        scope.otChangeValue(file, function (err) {
          if (!err) {
            console.log('changing otvalue', file);
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
