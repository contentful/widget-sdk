'use strict';

angular.module('contentful')
.directive('cfDatetimeEditor', ['require', function (require) {
  var _ = require('lodash');
  var zoneOffsets = require('zoneOffsets');
  var moment = require('moment');
  var Datepicker = require('datepicker');
  var $timeout = require('$timeout');

  var DATE_FORMAT_INTERNAL = 'YYYY-MM-DD'; // moment.js format
  var LOCAL_TIMEZONE = moment().format('Z');

  // Patterns to validate and parse user input
  var DATE_RX = '(\\d{4}-\\d{2}-\\d{2})';
  var ZONE_RX = '(Z|[+-]\\d{2}:?\\d{2})?';
  var TIME_RX =
    '([0-1]?[0-9]|2[0-3])' + // hours
    ':([0-5][\\d])' + // minutes
    '(?::([0-5][\\d])(?:\\.(\\d{3}))?)?'; // seconds + milliseconds :XX.YYY
  var ISO_8601_RX = new RegExp(
    '^' + DATE_RX + '(?:T(' + TIME_RX + ')' + ZONE_RX + ')?'
  );
  var TIME_RX_12 =
    '(0?[1-9]|1[0-2])' + // hours
    ':([0-5][\\d])' + // minutes
    '(?::([0-5][\\d])(?:\\.(\\d{3}))?)?'; // seconds + milliseconds :XX.YYY

  // WARNING!
  // This directive is also used in "cf_validation_date_select.jade"!
  // Please keep it in mind when rewriting to use widgetApi
  return {
    restrict: 'A',
    template: require('components/forms/datetime_editor/cf_datetime_editor').default(),
    require: 'ngModel',
    link: function (scope, elm, _attr, ngModelCtrl) {
      var dateController = elm.find('.date').controller('ngModel');
      var timeController = elm.find('.time').controller('ngModel');
      var ampmController = elm.find('.ampm').controller('ngModel');
      var zoneController = elm.find('.zone').controller('ngModel');

      scope.timezones = zoneOffsets;
      scope.tzOffset = LOCAL_TIMEZONE;
      scope.ampm = 'am';
      scope.maxTime = uses24hMode() ? '23:59:59' : '12:59:59';

      scope.$watch(uses24hMode, function () {
        ngModelCtrl.$render();
      });

      scope.$watch('widget.settings.format', function (format) {
        scope.hasTime = format !== 'dateonly';
        scope.hasTimezone = format === 'timeZ';
        scope.setFromISO(ngModelCtrl.$modelValue);
      });

      ngModelCtrl.$render = function () {
        scope.setFromISO(ngModelCtrl.$modelValue);
      };

      var datepicker = Datepicker.create({
        field: elm.find('.date').get(0),
        format: DATE_FORMAT_INTERNAL,
        firstDay: 1,
        onSelect: function (date) {
          scope.$apply(function () {
            dateController.$setViewValue(
              moment(date).format(DATE_FORMAT_INTERNAL)
            );
          });
        }
      });

      var handleMouseDownOnCalendarIcon = function (e) {
        if (e.path.indexOf(elm.find('i.fa.fa-calendar').get(0)) > -1) {
          e.preventDefault();
        }
      };

      document.addEventListener('mousedown', handleMouseDownOnCalendarIcon, true);

      scope.handleCalendarIconClick = function (e) {
        e.stopPropagation();
        datepicker.isVisible() ? datepicker.hide() : datepicker.show();
      };

      scope.$on('$destroy', function () {
        datepicker.destroy();
        document.removeEventListener('mousedown', handleMouseDownOnCalendarIcon, true);
      });

      dateController.$parsers.unshift(function (viewValue) {
        var date = moment(viewValue, moment.ISO_8601);
        scope.dateInvalid = !date.isValid();
        return date.isValid() ? date.format(DATE_FORMAT_INTERNAL) : null;
      });

      dateController.$formatters.push(function (modelValue) {
        if (modelValue) {
          return moment(modelValue).format(DATE_FORMAT_INTERNAL);
        } else {
          return null;
        }
      });

      dateController.$render = function () {
        elm.find('.date').val(dateController.$viewValue);
        $timeout(function () {
          if (dateController.$modelValue) {
            datepicker.setDate(dateController.$modelValue);
          }
        });
      };

      timeController.$parsers.push(function (viewValue) {
        var time = parseTimeInput(viewValue);
        if (time) {
          timeController.$setValidity('format', true);
          return time;
        } else {
          timeController.$setValidity('format', false);
        }
      });

      function changeHandler () {
        var value = buildIsoString(
          scope.localDate,
          scope.localTime,
          scope.ampm,
          scope.tzOffset
        );
        ngModelCtrl.$setViewValue(value);
      }

      /**
     * Takes the view components of the date and returns the
     * corresponding ISO 8601 string. Returns `undefined` if
     * `localDate` is falsy.
     */
      function buildIsoString (localDate, localTime, ampm, tzOffset) {
        // Returning undefined forces the removal of the date value
        // from the OT doc.
        if (!localDate) return void 0;
        if (!localTime) return localDate;
        if (!tzOffset) return localDate + 'T' + make24hTime(localTime, ampm);
        else return localDate + 'T' + make24hTime(localTime, ampm) + tzOffset;
      }

      dateController.$viewChangeListeners.push(changeHandler);
      timeController.$viewChangeListeners.push(changeHandler);
      ampmController.$viewChangeListeners.push(changeHandler);
      zoneController.$viewChangeListeners.push(changeHandler);

      // TODO This method is only exposed for testing. It should be
      // removed from the scope.
      // In fact, this should be a function that returns a object
      // containing the four components which we then can apply to the
      // scope.
      scope.setFromISO = function (iso) {
        var tokens = parseIso(iso);
        var tzOffset = LOCAL_TIMEZONE;

        if (tokens) {
          var dateTime = tokens.tzString
            ? moment(iso).utcOffset(iso)
            : moment(iso);
          tzOffset = tokens.tzString ? dateTime.format('Z') : scope.tzOffset;
          scope.localDate = dateTime.format(DATE_FORMAT_INTERNAL);
          scope.localTime = tokens.time
            ? makeLocalTime(tokens.time)
            : scope.localTime;
          scope.ampm = dateTime.format('a');
        } else {
          scope.localDate = null;
          scope.ampm = 'am';
        }

        scope.tzOffset = scope.hasTimezone ? tzOffset : null;
      };

      scope.$watch(function () {
        return !ngModelCtrl.$modelValue && !_.isEmpty(timeController.$modelValue);
      }, function (invalid) {
        scope.dateInvalid = invalid;
      });

      scope.$watch(function () {
        return timeController.$error.format;
      }, function (invalid) {
        scope.timeInvalid = invalid;
      });

      function parseIso (isoString) {
        if (!_.isString(isoString) || !moment(isoString).isValid()) {
          return null;
        }

        var results = ISO_8601_RX.exec(isoString);
        if (results) {
          return {
            date: results[1],
            time: results[2],
            hours: results[3],
            minutes: results[4],
            seconds: results[5],
            milliseconds: results[6],
            tzString: results[7]
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
              date: m.format('YYYY-MM-DD'),
              time: m.format(timeFmt),
              hours: m.format('HH'),
              minutes: m.format('mm'),
              seconds: m.format('ss'),
              milliseconds: m.format('.SSS'),
              tzString: m.format('Z')
            };
          } else {
            return null;
          }
        }
      }

      function parseTimeInput (value) {
        var localTimeRx = uses24hMode() ? TIME_RX : TIME_RX_12;
        var inputMatcher = '^\\s*(' + localTimeRx + ')?\\s*$';
        var match = value.match(inputMatcher);
        var time = match && match[1];
        if (time && time.match(/^\d:/)) {
          time = '0' + time;
        }

        return time || null;
      }

      function make24hTime (localTime, ampm) {
        if (uses24hMode()) {
          return localTime;
        }

        var seg = localTime.split(':');
        var hour = parseInt(seg[0], 10);
        hour =
          ampm === 'am' && hour === 12
            ? 0
            : ampm === 'pm' && hour < 12 ? hour + 12 : hour;
        seg[0] =
          hour === 0 ? '00' : hour < 10 ? '0' + String(hour) : String(hour);
        return seg.join(':');
      }

      function makeLocalTime (timeStr) {
        if (uses24hMode()) {
          return timeStr;
        }

        var seg = timeStr.split(':');
        var hour = parseInt(seg[0], 10);
        hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        seg[0] =
          hour === 0 ? '00' : hour < 10 ? '0' + String(hour) : String(hour);
        return seg.join(':');
      }

      function uses24hMode () {
        return _.get(scope, 'widget.settings.ampm') !== '12';
      }
    }
  };
}]);
