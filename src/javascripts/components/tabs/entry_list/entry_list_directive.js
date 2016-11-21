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
      // We obtain a reference to the publishedCTs directly so that if
      // we are changing the space we do not refer to the new CT
      // repository.
      var publishedCTs = spaceContext.publishedCTs;

      var collapsedStates = {};
      var expandedField;

      scope.expandColumn = function (field) {
        expandedField = field.id;
        $timeout(collapseColumns);
      };

      K.onValueScope(scope, publishedCTs.items$, function (cts) {
        scope.contentTypeSelectOptions = cts.map(function (ct) {
          return {
            id: ct.sys.id,
            name: ct.name
          };
        }).toArray();
      });

      scope.contentTypeName = function (entry) {
        var ctId = entry.getContentTypeId();
        var ct = publishedCTs.get(ctId);
        if (ct) {
          return ct.getName();
        } else {
          return '';
        }
      };

      // TODO This function is called repeatedly from the template.
      // Unfortunately, 'publishedCTs.get' has the side effect of
      // fetching the CT if it was not found. This results in problems
      // when we switch the space but this directive is still active. We
      // request a content type from the _new_ space which does not
      // exist.
      // The solution is to separate `entryTitle()` and similar
      // functions from the space context.
      scope.entryTitle = function (entry) {
        return spaceContext.entryTitle(entry);
      };

      // Must be deferred because it depends on the rendered content

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
