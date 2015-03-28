'use strict';

angular.module('contentful')
.directive('cfDatetimeEditor', ['$injector', function($injector){
  var $parse = $injector.get('$parse');
  var zoneOffsets = $injector.get('zoneOffsets');
  var moment = $injector.get('moment');

  // The format strings for datepicker and moment.js are different!
  var DATE_FORMAT = $.datepicker.ISO_8601; // datepicker format
  var DATE_FORMAT_INTERNAL = 'YYYY-MM-DD'; // moment.js format
  var LOCAL_TIMEZONE = moment().format('Z');

  // Patterns to validate and parse user input
  var DATE_RX = '(\\d{4}-\\d{2}-\\d{2})';
  var ZONE_RX = '(Z|[+-]\\d{2}:?\\d{2})?';
  var TIME_RX = '([0-1]?[0-9]|2[0-3])'+ // hours
                ':([0-5][\\d])'+ //minutes
                '(?::([0-5][\\d])(?:\\.(\\d{3}))?)?';  //seconds + milliseconds :XX.YYY
  var ISO_8601_RX = new RegExp('^'+DATE_RX+'(?:T('+TIME_RX+')'+ZONE_RX+')?');
  var TIME_RX_12 = '(0?[1-9]|1[0-2])'+ // hours
                   ':([0-5][\\d])'+ //minutes
                   '(?::([0-5][\\d])(?:\\.(\\d{3}))?)?';  //seconds + milliseconds :XX.YYY

  return {
    restrict: 'A',
    template: JST['cf_datetime_editor'],
    require: 'ngModel',
    link: function(scope, elm, attr, ngModelCtrl) {
      var ngModelGet = $parse(attr.ngModel),
          ngModelSet = ngModelGet.assign;

      var dateController = elm.find('.date').controller('ngModel');
      var timeController = elm.find('.time').controller('ngModel');
      var ampmController = elm.find('.ampm').controller('ngModel');
      var zoneController = elm.find('.zone').controller('ngModel');

      scope.timezones = zoneOffsets;
      scope.tzOffset = LOCAL_TIMEZONE;
      scope.ampm = 'am';
      if (scope.widget && scope.widget.widgetParams.ampm == '12')
        scope.maxTime = '12:59:59';
      else
        scope.maxTime = '23:59:59';

      scope.$watch('widget.widgetParams.ampm', function(){
        ngModelCtrl.$render();
      });

      scope.$watch('widget.widgetParams.format', function (format) {
        scope.hasTime     = format != 'dateonly';
        scope.hasTimezone = format == 'timeZ';
      });

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

      timeController.$parsers.push(function(viewValue){
        var time_rx = timeRx();
        var match = viewValue.match('^\\s*('+time_rx+')?\\s*$');
        if (match) {
          timeController.$setValidity('format', true);
          var time = match[1];
          if (time) {
            time = time.match(/^\d:/) ? '0'+time : time;
            return time;
          }
        } else {
          timeController.$setValidity('format', false);
        }
      });

      function changeHandler() {
        var value = buildValue(scope.localDate, scope.localTime, scope.ampm, scope.tzOffset);
        if (scope.otChangeValue) {
          scope.otChangeValue(value)
          .then(function() {
              ngModelCtrl.$setViewValue(value);
          }, function() {
              scope.setFromISO(ngModelCtrl.$modelValue);
          });
        } else {
          ngModelCtrl.$setViewValue(value);
        }
      }

      function buildValue(localDate, localTime, ampm, tzOffset) {
        if (!localDate) return null;
        if (!localTime) return localDate;
        if (!tzOffset)  return localDate + 'T' + make24hTime(localTime, ampm);
        else            return localDate + 'T' + make24hTime(localTime, ampm) + tzOffset;
      }

      dateController.$viewChangeListeners.push(changeHandler);
      timeController.$viewChangeListeners.push(changeHandler);
      ampmController.$viewChangeListeners.push(changeHandler);
      zoneController.$viewChangeListeners.push(changeHandler);

      scope.setFromISO = function(iso){
        if (_.isString(iso) && moment(iso).isValid()) {
          var tokens = parseIso(iso);
          var dateTime = tokens.tzString ? moment(iso).zone(iso) : moment(iso);
          scope.localDate = dateTime.format(DATE_FORMAT_INTERNAL);
          scope.localTime = tokens.time ? makeLocalTime(tokens.time) : null;
          scope.ampm      = dateTime.format('a');
          scope.tzOffset  = tokens.tzString ? dateTime.format('Z') : null;
        } else {
          scope.localDate = null;
          scope.localTime = null;
          scope.ampm      = 'am';
          scope.tzOffset  = LOCAL_TIMEZONE;
        }
      };

      scope.$watch(function () {
        return !ngModelCtrl.$modelValue && !_.isEmpty(timeController.$modelValue);
      }, function (invalid, old, scope) {
        scope.dateInvalid = invalid;
      });

      scope.$watch(function () {
        return timeController.$error.format;
      }, function (invalid, old, scope) {
        scope.timeInvalid = invalid;
      });

      scope.$on('otValueChanged', function(event, path, value) {
        if (path === event.currentScope.otPath) {
          ngModelSet(event.currentScope, value);
        }
      });

      function parseIso(isoString) {
        var results = ISO_8601_RX.exec(isoString);
        if (results) {
          return {
            date:          results[1],
            time:          results[2],
            hours:         results[3],
            minutes:       results[4],
            seconds:       results[5],
            milliseconds:  results[6],
            tzString:      results[7]
          };
        } else {
          var m = moment(isoString).zone(isoString);
          if (m.isValid()) {
            var timeFmt = 'HH:mm';
            if (m.milliseconds()) {
              timeFmt = timeFmt + ':ss.SSS';
            } else if (m.seconds()) {
              timeFmt = timeFmt + ':ss';
            }
            return {
              date:         m.format('YYYY-MM-DD'),
              time:         m.format(timeFmt),
              hours:        m.format('HH'),
              minutes:      m.format('mm'),
              seconds:      m.format('ss'),
              milliseconds: m.format('.SSS'),
              tzString:     m.format('Z')
            };
          } else {
            return null;
          }
        }
      }

      function timeRx() {
        return (scope.widget && scope.widget.widgetParams.ampm === '12') ? TIME_RX_12 : TIME_RX;
      }

      function make24hTime(localTime, ampm) {
        if (scope.widget && scope.widget.widgetParams.ampm === '12') {
          var seg  = localTime.split(':');
          var hour = parseInt(seg[0], 10);
          hour   = ampm === 'am' && hour === 12 ? 0 :
                   ampm === 'pm' && hour  <  12 ? hour + 12 :
                   hour;
          seg[0] = hour ===  0 ? '00' :
                   hour  <  10 ? '0' + String(hour) :
                   String(hour);
          return seg.join(':');
        } else {
          return localTime;
        }
      }

      function makeLocalTime(timeStr) {
        if (scope.widget && scope.widget.widgetParams.ampm === '12') {
          var seg  = timeStr.split(':');
          var hour = parseInt(seg[0], 10);
          hour   = hour ===  0 ? 12 :
                   hour  >  12 ? hour - 12 :
                   hour;
          seg[0] = hour ===  0 ? '00' :
                   hour  <  10 ? '0' + String(hour) :
                   String(hour);
          return seg.join(':');
        } else {
          return timeStr;
        }
      }

    }
  };
}]);
