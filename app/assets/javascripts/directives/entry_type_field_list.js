'use strict';

angular.module('contentful').directive('entryTypeFieldList', function(analytics) {
  return {
    restrict: 'C',
    template: JST.entry_type_field_list(),
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

    },

    controller: function EntryTypeFieldListCtrl($scope) {
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

      $scope.$watch('publishedEntryType', function(et, old, scope) {
        if (et && et.data.fields)
          scope.publishedIds = _.pluck(et.data.fields, 'id');
      });

      $scope.removeDisplayField = function () {
        $scope.otDoc.at(['displayField']).set(null, function (err) {
          if (!err) $scope.$apply(function (scope) {
            scope.entryType.data.displayField = null;
          });
        });
      };

    }
  };
});
