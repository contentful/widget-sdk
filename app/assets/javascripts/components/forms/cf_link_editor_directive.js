angular.module('contentful').directive('cfLinkEditor', function(mimetype){
  'use strict';

  return {
    restrict: 'A',
    require: 'ngModel',
    template: JST['cf_link_editor'],
    controller: 'cfLinkEditorCtrl',
    link: function(scope, elem, attrs, ngModelCtrl) {

      ngModelCtrl.$render = function () {
        if (!angular.equals(ngModelCtrl.$viewValue, scope.links)) {
          scope.links = ngModelCtrl.$viewValue;
        }
      };

      scope.linkType     = scope.$eval(attrs.cfLinkEditor);
      scope.fetchMethod  = scope.linkType === 'Entry' ? 'getEntries' : 'getAssets';

      scope.linkMultiple = !!attrs.linkMultiple;
      scope.linkSingle   = !scope.linkMultiple;

      if(scope.linkType == 'Entry') {
        scope.$watch('linkContentType', function (contentType) {
          if(contentType){
            scope.entityName = contentType ? contentType.getName() : undefined;
          } else {
            scope.entityName = scope.linkType;
          }
        });
      }

      if(scope.linkType == 'Asset') {
        scope.$watch('linkMimetypeGroup', function (mimetypeName) {
          if(mimetypeName){
            scope.entityName = mimetype.groupDisplayNames[mimetypeName];
          } else {
            scope.entityName = scope.linkType;
          }
        });
      }

      scope.updateModel = function () {
        ngModelCtrl.$setViewValue(scope.links);
      };

      if (scope.linkSingle) {
        ngModelCtrl.$parsers.push(function (viewValue) {
          return viewValue ? viewValue[0] : null;
        });
        ngModelCtrl.$formatters.push(function (modelValue) {
          return modelValue ? [modelValue] : [];
        });
      }

      scope.linkSortOptions = {
        disabled: scope.linkSingle,
        handle: '.drag-handle',
        forceHelperSize: true,
        update: function(e, ui) {
          var oldIndex = ui.item.sortable.index;
          var newIndex = ui.item.sortable.dropindex;
          scope.otDoc.at(scope.otPath).move(oldIndex, newIndex, function() {
            scope.$apply('otUpdateEntity()');
          });
        }
      };

    }
  };
});

