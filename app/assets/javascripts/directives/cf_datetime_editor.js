/*global moment:false*/
angular.module('contentful/directives').directive('cfDatetimeEditor', function(){
  'use strict';

  return {
    restrict: 'C',
    template: JST['cf_datetime_editor'],
    link: function(scope, elm) {
      // The format strings for datepicker and moment.js are different!
      var DATE_FORMAT = $.datepicker.ISO_8601; // datepicker format
      var DATE_FORMAT_INTERNAL = 'YYYY-MM-DD'; // moment.js format
      // Prefer datepicker localization, this is just a shortcut

      var dateController = elm.find('.date').controller('ngModel');
      var timeController = elm.find('.time').controller('ngModel');

      elm.find('.date').datepicker({
        dateFormat: DATE_FORMAT,
        onSelect: function(dateString) {
          scope.$apply(function() {
            dateController.$setViewValue(dateString);
          });
        }
      });

      dateController.$parsers.unshift(function(viewValue) {
        var raw = $.datepicker.parseDate(DATE_FORMAT, viewValue);
        var date = moment(raw).format(DATE_FORMAT_INTERNAL);
        return date;
      });

      dateController.$formatters.push(function(modelValue) {
        var raw = moment(modelValue, DATE_FORMAT_INTERNAL).toDate();
        var date = $.datepicker.formatDate(DATE_FORMAT, raw);
        return date;
      });

      dateController.$render = function() {
        elm.find('.date').datepicker('setDate', dateController.$viewValue);
      };
      
      var changeHandler = function(){
        var date = dateController.$modelValue;
        var time = timeController.$modelValue;
        //if (!time || time.length == 0)
        // TODO handle case where Time isn't set or where nothing is set
        if (!(date && time) ) return;

        var dateAndTime = dateController.$modelValue+'T'+timeController.$modelValue;
        var dateTime = moment(dateAndTime);
        scope.changeValue(dateTime.utc().format());
      };
      dateController.$viewChangeListeners.push(changeHandler);
      timeController.$viewChangeListeners.push(changeHandler);

      scope.setFromISO = function(iso){
        var dateTime = moment.utc(iso).local();
        scope.localDate = dateTime.format(DATE_FORMAT_INTERNAL);
        if (dateTime.seconds()) {
          scope.localTime = dateTime.format('HH:mm:ss');
        } else {
          scope.localTime = dateTime.format('HH:mm');
        }
      };

      scope.$on('valueChanged', function(event, value) {
        event.currentScope.setFromISO(value);
      });
    }
  };
});



