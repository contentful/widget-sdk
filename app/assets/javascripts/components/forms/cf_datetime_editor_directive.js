/*global moment:false*/
angular.module('contentful').directive('cfDatetimeEditor', ['$parse', 'zoneOffsets', function($parse, zoneOffsets){
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
      var zoneController = elm.find('.zone').controller('ngModel');

      scope.timezones = zoneOffsets;
      scope.tzOffset = moment().format('Z');

      ngModelCtrl.$render = function () {
        scope.setFromISO(ngModelCtrl.$modelValue);
      };

      elm.find('.date').datepicker({
        dateFormat: DATE_FORMAT,
        firstDay: 1,
        onSelect: function(dateString) {
          $(this).val(dateString);
          scope.$apply(function() {
            dateController.$setViewValue(dateString);
          });
        }
      });

      dateController.$parsers.unshift(function(viewValue) {
        var raw;
        try {
          raw = $.datepicker.parseDate(DATE_FORMAT, viewValue);
          scope.dateInvalid = false;
        } catch(e) {
          scope.dateInvalid = true;
        }
        return raw ? moment(raw).format(DATE_FORMAT_INTERNAL) : null;
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
        var time = scope.localTime || '00:00';
        time = time.match(/^\d:/) ? '0'+time : time;
        var zone = scope.tzOffset;
        var value = date ? moment(date+'T'+time+zone).zone(zone).format() : null;

        scope.otChangeValue(value, function (err) {
          if (!err) {
            //console.log('setting view Value to', value);
            ngModelCtrl.$setViewValue(value);
          } else {
            //console.log('setting resetting view  Value from', ngModelCtrl.$modelValue);
            scope.setFromISO(ngModelCtrl.$modelValue);
          }
        });
      }

      dateController.$viewChangeListeners.push(changeHandler);
      timeController.$viewChangeListeners.push(changeHandler);
      zoneController.$viewChangeListeners.push(changeHandler);

      ngModelCtrl.$render = function () {
        scope.setFromISO(ngModelCtrl.$viewValue);
      };

      scope.setFromISO = function(iso){
        if (_.isString(iso) && moment(iso).isValid()) {
          var dateTime = hasTimezone(iso) ? moment(iso).zone(iso) : moment(iso);
          scope.localDate = dateTime.format(DATE_FORMAT_INTERNAL);
          if (dateTime.seconds()) {
            scope.localTime = dateTime.format('HH:mm:ss');
          } else {
            scope.localTime = dateTime.format('HH:mm');
          }
          scope.tzOffset = dateTime.format('Z');
        } else {
          scope.localDate = null;
          scope.localTime = null;
        }
      };

      scope.$watch(function () {
        return !ngModelCtrl.$modelValue && !_.isEmpty(timeController.$modelValue);
      }, function (invalid, old, scope) {
        scope.dateInvalid = invalid;
      });

      scope.$watch(function () {
        return timeController.$error.pattern;
      }, function (invalid, old, scope) {
        scope.timeInvalid = invalid;
      });

      scope.$on('otValueChanged', function(event, path, value) {
        if (path === event.currentScope.otPath) {
          ngModelSet(event.currentScope, value);
        }
      });

      function hasTimezone(isoString) {
        var parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i; // +00:00 -00:00 +0000 -0000 or Z
        return parseTokenTimezone.test(isoString);
      }
    }
  };
}]);



