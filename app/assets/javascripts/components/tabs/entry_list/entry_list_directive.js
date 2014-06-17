'use strict';

angular.module('contentful').directive('entryList', function($timeout){
  // Definitions for narrow/medium types in entry list controller
  var classToWidth = {
    narrow: 70,
    medium: 130
  };

  return {
    template: JST.entry_list(),
    restrict: 'C',
    controller: 'EntryListCtrl',
    link: function (scope, elem) {

      scope.$watch('selection.isEmpty()', function (empty) {
        if (empty) {
          elem.removeClass('with-tab-actions');
        } else {
          elem.addClass('with-tab-actions');
        }
      });

      var collapsedStates = {};
      var expandedField;

      scope.getFieldCollapsedClass= function (field) {
        return collapsedStates[field.id] ? 'collapsed' : '';
      };

      scope.isFieldCollapsed = function (field) {
        return collapsedStates[field.id];
      };

      scope.expandColumn = function (field) {
        expandedField = field.id;
        $timeout(collapseColumns);
      };

      // Must be deferred because it depends on the rendered content
      scope.$watch('displayedFields', _.partial($timeout, collapseColumns), true);

      function collapseColumns() {
        elem.find('th.collapsed').removeClass('collapsed');
        collapsedStates = {};
        _.forEach(scope.displayedFields, collapseElement);
      }


      function collapseElement(field) {
        var fieldEl = elem.find('th[data-field-id='+field.id+']');
        var minWidth = getMinWidth(fieldEl.get(0));

        if(!fieldEl.hasClass('collapsed') && field.id !== expandedField && !isOrderingField(fieldEl) && fieldEl.width() < minWidth) {
          //console.log('field.id %s field width: %d min width: %d', field.id, fieldEl.width(), minWidth);
          fieldEl.addClass('collapsed');
          collapsedStates[field.id] = true;
        } else {
          collapsedStates[field.id] = false;
        }
      }

      function getMinWidth(elem) {
        var minWidth;
        _.forEach(elem.className.split(' '), function (classname) {
          minWidth = classToWidth[classname];
          if(minWidth) return false;
        });

        if(!minWidth) throw new Error('No width class available for this element');
        return minWidth;
      }

      function isOrderingField(elem) {
        return elem.find('span').hasClass('active');
      }

      scope.getGroupName = function () {
        return 'Content Types';
      };

    }
  };
});
