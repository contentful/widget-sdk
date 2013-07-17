/*global moment:false*/
angular.module('contentful').directive('cfDatetimeEditor', function($parse){
  'use strict';

  return {
    restrict: 'C',
    template: JST['cf_datetime_editor'],
    require: 'ngModel',
    link: function(scope, elm, attr, ngModelCtrl) {
      // The format strings for datepicker and moment.js are different!
      var DATE_FORMAT = $.datepicker.ISO_8601; // datepicker format
      var DATE_FORMAT_INTERNAL = 'YYYY-MM-DD'; // moment.js format
      // Prefer datepicker localization, this is just a shortcut

      var ngModelGet = $parse(attr.ngModel),
          ngModelSet = ngModelGet.assign;

      var dateController = elm.find('.date').controller('ngModel');
      var timeController = elm.find('.time').controller('ngModel');

      ngModelCtrl.$render = function () {
        scope.setFromISO(ngModelCtrl.$modelValue);
      };

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
        var date = moment(raw);
        date = date ? date.format(DATE_FORMAT_INTERNAL) : null;
        return date;
      });

      dateController.$formatters.push(function(modelValue) {
        if (modelValue) {
          var raw = moment(modelValue, DATE_FORMAT_INTERNAL).toDate();
          var date = $.datepicker.formatDate(DATE_FORMAT, raw);
          return date;
        } else{
          return null;
        }
      });

      dateController.$render = function() {
        elm.find('.date').datepicker('setDate', dateController.$viewValue);
      };

      function changeHandler() {
        var date = scope.localDate;
        var time = scope.localTime || '0:00';
        var value = date ? moment(date+'T'+time).utc().format() : null;

        scope.otChangeValue(value, function (err) {
          if (!err) {
            ngModelCtrl.$setViewValue(value);
          } else {
            scope.setFromISO(ngModelCtrl.$modelValue);
          }
        });
      }

      dateController.$viewChangeListeners.push(changeHandler);
      timeController.$viewChangeListeners.push(changeHandler);

      ngModelCtrl.$render = function () {
        scope.setFromISO(ngModelCtrl.$viewValue);
      };

      scope.setFromISO = function(iso){
        if (_.isString(iso)) {
          var dateTime = moment.utc(iso).local();
          scope.localDate = dateTime.format(DATE_FORMAT_INTERNAL);
          if (dateTime.seconds()) {
            scope.localTime = dateTime.format('HH:mm:ss');
          } else {
            scope.localTime = dateTime.format('HH:mm');
          }
        } else {
          scope.localDate = null;
          scope.localTime = null;
        }
      };

      scope.$watch(function () {
        return !ngModelCtrl.$modelValue && !_.isEmpty(timeController.$viewValue);
      }, function (invalid, old, scope) {
        scope.dateInvalid = invalid;
      });

      scope.$on('otValueChanged', function(event, path, value) {
        if (path === event.currentScope.otPath) {
          ngModelSet(event.currentScope, value);
        }
      });
    }
  };
});



