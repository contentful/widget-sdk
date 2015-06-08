'use strict';
angular.module('contentful').directive('cfAutocompleteDate', function(){
  var DATE_FORMAT          =   'yy-mm-dd'; // datepicker format
  var DATE_FORMAT_INTERNAL = 'YYYY-MM-DD'; // moment.js format

  return {
    restrict: 'A',
    template: JST['cf_autocomplete_date'](),
    link: function(scope, elem){
      var $datepicker = elem.find('.datepicker');
      $datepicker.datepicker({
        dateFormat: DATE_FORMAT,
        onSelect: function(dateString) {
          scope.$apply(function(scope) {
            scope.fillAutocompletion(dateString);
          });
        },
        defaultDate: getDate(),
        firstDay: 1,
      });

      scope.$on('autocompletionsUpdated', function () {
        var date = getDate();
        if (date) $datepicker.datepicker('setDate', date);
      });

      scope.$evalAsync(function () {
        var date = moment($datepicker.datepicker('getDate')).format(DATE_FORMAT_INTERNAL);
        scope.fillAutocompletion(date);
      });

      scope.$on('selectNextAutocompletion', function () {
        adjustDate(+1);
      });

      scope.$on('selectPreviousAutocompletion', function () {
        adjustDate(-1);
      });

      function adjustDate(offset) {
        var date = $datepicker.datepicker('getDate');
        var m = date ? moment(date) : moment();
        m = m.add(offset, 'days');
        $datepicker.datepicker('setDate', m.format(DATE_FORMAT_INTERNAL));
        scope.fillAutocompletion(m.format(DATE_FORMAT_INTERNAL));
      }

      function getDate() {
        var dateStr = scope.currentTokenContent();
        if (dateStr && dateStr.match(/\d{4}-\d{1,2}-\d{1,2}/)) {
          return dateStr;
        }
      }
    }
  };
});
