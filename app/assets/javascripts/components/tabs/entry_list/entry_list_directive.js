'use strict';

angular.module('contentful').directive('entryList', function(){
  var classToWidth = {
    narrow: 100,
    medium: 150
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
        _.defer(collapseColumns);
      };

      // Must be deferred because it depends on the rendered content
      scope.$watch('displayedFields', _.partial(_.defer, collapseColumns), true);

      function collapseColumns() {
        elem.find('th.collapsed').removeClass('collapsed');
        collapsedStates = {};
        _.forEach(scope.displayedFields, collapseElement);
        // We need to trigger the cycle due to the previous defer
        scope.$digest();
      }


      function collapseElement(field) {
        var fieldEl = elem.find('th[data-field-id='+field.id+']');
        var minWidth = getMinWidth(fieldEl.get(0));

        if(!fieldEl.hasClass('collapsed') && field.id !== expandedField && !isOrderingField(fieldEl) && fieldEl.width() < minWidth) {
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

    }
  };
});
