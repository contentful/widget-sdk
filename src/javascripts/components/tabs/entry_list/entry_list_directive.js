'use strict';

angular.module('contentful').directive('cfEntryList', [
  'require',
  require => {
    const $timeout = require('$timeout');
    const spaceContext = require('spaceContext');
    const K = require('utils/kefir.es6');

    // Definitions for narrow/medium types in entry list controller
    const classToWidth = {
      narrow: 70,
      medium: 130
    };

    return {
      template: JST.entry_list(),
      restrict: 'A',
      controller: 'EntryListController',
      link: function(scope, elem) {
        // We obtain a reference to the publishedCTs directly so that if
        // we are changing the space we do not refer to the new CT
        // repository.
        const publishedCTs = spaceContext.publishedCTs;

        let collapsedStates = {};
        let expandedField;

        scope.expandColumn = field => {
          expandedField = field.id;
          $timeout(collapseColumns);
        };

        K.onValueScope(scope, publishedCTs.items$, cts => {
          scope.contentTypeSelectOptions = cts.map(ct => ({
            id: ct.sys.id,
            name: ct.name
          }));
        });

        scope.contentTypeName = entry => {
          const ctId = entry.getContentTypeId();
          const ct = publishedCTs.get(ctId);
          if (ct) {
            return ct.getName();
          } else {
            return '';
          }
        };

        // Must be deferred because it depends on the rendered content

        function collapseColumns() {
          elem.find('th.collapsed').removeClass('collapsed');
          collapsedStates = {};
          _.forEach(scope.displayedFields, collapseElement);
        }

        function collapseElement(field) {
          const fieldEl = elem.find('th[data-field-id=' + field.id + ']');
          const minWidth = getMinWidth(fieldEl.get(0));

          if (
            !fieldEl.hasClass('collapsed') &&
            field.id !== expandedField &&
            !isOrderingField(fieldEl) &&
            fieldEl.width() < minWidth
          ) {
            // console.log('field.id %s field width: %d min width: %d', field.id, fieldEl.width(), minWidth);
            fieldEl.addClass('collapsed');
            collapsedStates[field.id] = true;
          } else {
            collapsedStates[field.id] = false;
          }
        }

        function getMinWidth(elem) {
          let minWidth;
          _.forEach(elem.className.split(' '), classname => {
            minWidth = classToWidth[classname];
            if (minWidth) return false;
          });

          if (!minWidth) throw new Error('No width class available for this element');
          return minWidth;
        }

        function isOrderingField(elem) {
          return elem.find('span').hasClass('active');
        }
      }
    };
  }
]);
