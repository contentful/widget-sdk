'use strict';

angular.module('contentful')
.directive('cfEntryList', ['require', function (require) {
  var $timeout = require('$timeout');
  var spaceContext = require('spaceContext');
  var K = require('utils/kefir');

  // Definitions for narrow/medium types in entry list controller
  var classToWidth = {
    narrow: 70,
    medium: 130
  };

  return {
    template: JST.entry_list(),
    restrict: 'A',
    controller: 'EntryListController',
    link: function (scope, elem) {

      var collapsedStates = {};
      var expandedField;

      scope.getFieldCollapsedClass = function (field) {
        return collapsedStates[field.id] ? 'collapsed' : '';
      };

      scope.isFieldCollapsed = function (field) {
        return collapsedStates[field.id];
      };

      scope.expandColumn = function (field) {
        expandedField = field.id;
        $timeout(collapseColumns);
      };

      K.onValueScope(scope, spaceContext.publishedCTs.items$, function (cts) {
        scope.contentTypeSelectOptions = cts.map(function (ct) {
          return {
            id: ct.sys.id,
            name: ct.name
          };
        }).toArray();
      });

      scope.contentTypeName = function (entry) {
        var ctId = entry.getContentTypeId();
        var ct = spaceContext.publishedCTs.get(ctId);
        if (ct) {
          return ct.getName();
        } else {
          return '';
        }
      };

      scope.entryTitle = function (entry) {
        return spaceContext.entryTitle(entry);
      };

      // Must be deferred because it depends on the rendered content
      scope.$watch('displayedFields', _.partial($timeout, collapseColumns), true);

      function collapseColumns () {
        elem.find('th.collapsed').removeClass('collapsed');
        collapsedStates = {};
        _.forEach(scope.displayedFields, collapseElement);
      }


      function collapseElement (field) {
        var fieldEl = elem.find('th[data-field-id=' + field.id + ']');
        var minWidth = getMinWidth(fieldEl.get(0));

        if (!fieldEl.hasClass('collapsed') && field.id !== expandedField && !isOrderingField(fieldEl) && fieldEl.width() < minWidth) {
          // console.log('field.id %s field width: %d min width: %d', field.id, fieldEl.width(), minWidth);
          fieldEl.addClass('collapsed');
          collapsedStates[field.id] = true;
        } else {
          collapsedStates[field.id] = false;
        }
      }

      function getMinWidth (elem) {
        var minWidth;
        _.forEach(elem.className.split(' '), function (classname) {
          minWidth = classToWidth[classname];
          if (minWidth) return false;
        });

        if (!minWidth) throw new Error('No width class available for this element');
        return minWidth;
      }

      function isOrderingField (elem) {
        return elem.find('span').hasClass('active');
      }
    }
  };
}]);
