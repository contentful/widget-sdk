'use strict';

angular.module('contentful').directive('contentTypeFieldList', function(analytics) {
  return {
    restrict: 'C',
    template: JST.content_type_field_list(),
    link: function link(scope, elm) {
      var body = elm.find('tbody').eq(0);
      body.sortable({
        handle: '.drag-handle',
        items: '.existing-field',
        forceHelperSize: true,
        start: function(event, ui) {
          scope.$apply(function(scope) {
            scope.closeAllValidations();
          });
          body.sortable('refresh');
          ui.item.startIndex = ui.item.index('.existing-field');
        },
        update: function(e, ui) {
          var oldIndex = ui.item.startIndex;
          var newIndex = ui.item.index('.existing-field');
          delete ui.item.startIndex;
          scope.otDoc.at('fields').move(oldIndex, newIndex, function(err) {
            if (err) {
              // undo DOM move operation
              if (oldIndex < newIndex){
                $(ui.item).insertBefore(body.children('.existing-field').at(oldIndex));
              } else {
                $(ui.item).insertAfter(body.children('.existing-field').at(oldIndex));
              }
            } else {
              scope.$apply('otUpdateEntity()');
            }
          });
        }
      });

      scope.$watch('otEditable', function (editable) {
        if (editable) {
          body.sortable('enable');
        } else {
          body.sortable('disable');
        }
      });

    },

    controller: function ContentTypeFieldListCtrl($scope) {
      var _showValidations = {};
      $scope.showValidations = function(fieldId) {
        return !!_showValidations[fieldId];
      };

      $scope.toggleValidations= function(fieldId) {
        _showValidations[fieldId] = !_showValidations[fieldId];
        if (_showValidations[fieldId]) {
          analytics.track('Opened Validations', { fieldId: fieldId });
        }
      };

      $scope.closeAllValidations = function () {
        _showValidations = {};
      };

      $scope.displayEnabled = function (field) {
        return field.type === 'Symbol' || field.type === 'Text';
      };

      $scope.$watch('publishedContentType', function(et, old, scope) {
        if (et && et.data.fields)
          scope.publishedIds = _.pluck(et.data.fields, 'id');
      });

      $scope.removeDisplayField = function () {
        $scope.otDoc.at(['displayField']).set(null, function (err) {
          if (!err) $scope.$apply(function (scope) {
            scope.contentType.data.displayField = null;
          });
        });
      };

    }
  };
});
