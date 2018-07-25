'use strict';
angular.module('contentful').directive('cfAutocompleteDate', ['require', require => {
  const moment = require('moment');
  const h = require('utils/hyperscript').h;

  const DATE_FORMAT = 'yy-mm-dd'; // datepicker format
  const DATE_FORMAT_INTERNAL = 'YYYY-MM-DD'; // moment.js format

  return {
    restrict: 'A',
    template: h('div', {
      style: {
        padding: '20px',
        textAlign: 'center'
      }
    }, [
      h('.datepicker', {
        style: {
          display: 'inline-block'
        }
      })
    ]),
    link: function (scope, elem) {
      const $datepicker = elem.find('.datepicker');
      $datepicker.datepicker({
        dateFormat: DATE_FORMAT,
        onSelect: function (dateString) {
          scope.$apply(scope => {
            scope.fillAutocompletion(dateString);
          });
        },
        defaultDate: getDate(),
        firstDay: 1
      });

      scope.$on('autocompletionsUpdated', () => {
        const date = getDate();
        if (date) {
          $datepicker.datepicker('setDate', date);
        }
      });

      scope.$evalAsync(() => {
        const date = moment($datepicker.datepicker('getDate')).format(DATE_FORMAT_INTERNAL);
        scope.fillAutocompletion(date);
      });

      scope.$on('selectNextAutocompletion', () => {
        adjustDate(+1);
      });

      scope.$on('selectPreviousAutocompletion', () => {
        adjustDate(-1);
      });

      function adjustDate (offset) {
        const date = $datepicker.datepicker('getDate');
        let m = date ? moment(date) : moment();
        m = m.add(offset, 'days');
        $datepicker.datepicker('setDate', m.format(DATE_FORMAT_INTERNAL));
        scope.fillAutocompletion(m.format(DATE_FORMAT_INTERNAL));
      }

      function getDate () {
        const dateStr = scope.currentTokenContent();
        if (dateStr && dateStr.match(/\d{4}-\d{1,2}-\d{1,2}/)) {
          return dateStr;
        }
      }
    }
  };
}]);
