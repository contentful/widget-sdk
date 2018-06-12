'use strict';
angular.module('contentful').directive('cfAutocompleteDate', ['require', require => {
  var moment = require('moment');
  var h = require('utils/hyperscript').h;

  var DATE_FORMAT = 'yy-mm-dd'; // datepicker format
  var DATE_FORMAT_INTERNAL = 'YYYY-MM-DD'; // moment.js format

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
      var $datepicker = elem.find('.datepicker');
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
        var date = getDate();
        if (date) {
          $datepicker.datepicker('setDate', date);
        }
      });

      scope.$evalAsync(() => {
        var date = moment($datepicker.datepicker('getDate')).format(DATE_FORMAT_INTERNAL);
        scope.fillAutocompletion(date);
      });

      scope.$on('selectNextAutocompletion', () => {
        adjustDate(+1);
      });

      scope.$on('selectPreviousAutocompletion', () => {
        adjustDate(-1);
      });

      function adjustDate (offset) {
        var date = $datepicker.datepicker('getDate');
        var m = date ? moment(date) : moment();
        m = m.add(offset, 'days');
        $datepicker.datepicker('setDate', m.format(DATE_FORMAT_INTERNAL));
        scope.fillAutocompletion(m.format(DATE_FORMAT_INTERNAL));
      }

      function getDate () {
        var dateStr = scope.currentTokenContent();
        if (dateStr && dateStr.match(/\d{4}-\d{1,2}-\d{1,2}/)) {
          return dateStr;
        }
      }
    }
  };
}]);
