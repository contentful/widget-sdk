'use strict';
angular.module('contentful').directive('cfSearchDatepicker', function(keycodes){
  var DATE_FORMAT          =   'yy-mm-dd'; // datepicker format
  var DATE_FORMAT_INTERNAL = 'YYYY-MM-DD'; // moment.js format

  return {
    restrict: 'C',
    link: function(scope, elem){
      elem.datepicker({
        dateFormat: DATE_FORMAT,
        onSelect: function(dateString) {
          scope.$apply(function(scope) {
            scope.fillSpecialCompletion(dateString);
          });
        },
        defaultDate: getDate(),
        firstDay: 1,
      });

      scope.$on('autocompletionsUpdated', function () {
        elem.datepicker('setDate', getDate());
      });

      scope.$evalAsync(function () {
        var date = moment(elem.datepicker('getDate')).format(DATE_FORMAT_INTERNAL);
        scope.fillSpecialCompletion(date);
      });

      scope.$on('autocompletionKeypress', function (event, inputEvent) {
        if (inputEvent.keyCode == keycodes.DOWN){
          adjustDate(+1);
          inputEvent.preventDefault();
        } else if (inputEvent.keyCode == keycodes.UP) {
          adjustDate(-1);
          inputEvent.preventDefault();
        } else if (inputEvent.keyCode == keycodes.ESC) {
          // TODO we should hide the special completion on escape and show it again on keydown,
          // but that needs to be handled by cfTokenizedSearch
        } else if (inputEvent.keyCode == keycodes.ENTER) {
          scope.confirmAutocompletion();
          event.preventDefault();
        }

      });

      function adjustDate(offset) {
        var date = elem.datepicker('getDate');
        var m = date ? moment(date) : moment();
        m = m.add('days', offset);
        elem.datepicker('setDate', m.format(DATE_FORMAT_INTERNAL));
        scope.fillSpecialCompletion(m.format(DATE_FORMAT_INTERNAL));
      }

      function getDate() {
        var dateStr = scope.readSpecialCompletion();
        if (dateStr.match(/\d{4}-\d{1,2}-\d{1,2}/)) {
          return dateStr;
        }
      }
    }
  };
});
