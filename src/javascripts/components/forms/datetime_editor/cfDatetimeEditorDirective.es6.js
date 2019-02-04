import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import moment from 'moment';
import templateDef from 'components/forms/datetime_editor/cf_datetime_editor.es6';
import zoneOffsets from 'zoneOffsets.es6';

export default function register() {
  registerDirective('cfDatetimeEditor', [
    '$timeout',
    'datepicker',
    ($timeout, Datepicker) => {
      const DATE_FORMAT_INTERNAL = 'YYYY-MM-DD'; // moment.js format
      const LOCAL_TIMEZONE = moment().format('Z');

      // Patterns to validate and parse user input
      const DATE_RX = '(\\d{4}-\\d{2}-\\d{2})';
      const ZONE_RX = '(Z|[+-]\\d{2}:?\\d{2})?';
      const TIME_RX =
        '([0-1]?[0-9]|2[0-3])' + // hours
        ':([0-5][\\d])' + // minutes
        '(?::([0-5][\\d])(?:\\.(\\d{3}))?)?'; // seconds + milliseconds :XX.YYY
      const ISO_8601_RX = new RegExp('^' + DATE_RX + '(?:T(' + TIME_RX + ')' + ZONE_RX + ')?');
      const TIME_RX_12 =
        '(0?[1-9]|1[0-2])' + // hours
        ':([0-5][\\d])' + // minutes
        '(?::([0-5][\\d])(?:\\.(\\d{3}))?)?'; // seconds + milliseconds :XX.YYY

      // WARNING!
      // This directive is also used in "cf_validation_date_select.jade"!
      // Please keep it in mind when rewriting to use widgetApi
      return {
        restrict: 'A',
        template: templateDef(),
        require: 'ngModel',
        link: function(scope, elm, _attr, ngModelCtrl) {
          const dateController = elm.find('.date').controller('ngModel');
          const timeController = elm.find('.time').controller('ngModel');
          const ampmController = elm.find('.ampm').controller('ngModel');
          const zoneController = elm.find('.zone').controller('ngModel');

          scope.timezones = zoneOffsets;
          scope.tzOffset = LOCAL_TIMEZONE;
          scope.ampm = 'am';
          scope.maxTime = uses24hMode() ? '23:59:59' : '12:59:59';

          scope.$watch(uses24hMode, () => {
            ngModelCtrl.$render();
          });

          scope.$watch('widget.settings.format', format => {
            scope.hasTime = format !== 'dateonly';
            scope.hasTimezone = format === 'timeZ';
            scope.setFromISO(ngModelCtrl.$modelValue);
          });

          ngModelCtrl.$render = () => {
            scope.setFromISO(ngModelCtrl.$modelValue);
          };

          const datepicker = Datepicker.create({
            field: elm.find('.date').get(0),
            format: DATE_FORMAT_INTERNAL,
            firstDay: 1,
            onSelect: function(date) {
              scope.$apply(() => {
                dateController.$setViewValue(moment(date).format(DATE_FORMAT_INTERNAL));
              });
            }
          });

          const handleMouseDownOnCalendarIcon = e => {
            if (e.path.indexOf(elm.find('i.fa.fa-calendar').get(0)) > -1) {
              e.preventDefault();
            }
          };

          document.addEventListener('mousedown', handleMouseDownOnCalendarIcon, true);

          scope.handleCalendarIconClick = e => {
            e.stopPropagation();
            datepicker.isVisible() ? datepicker.hide() : datepicker.show();
          };

          scope.$on('$destroy', () => {
            datepicker.destroy();
            document.removeEventListener('mousedown', handleMouseDownOnCalendarIcon, true);
          });

          dateController.$parsers.unshift(viewValue => {
            const date = moment(viewValue, moment.ISO_8601);
            scope.dateInvalid = !date.isValid();
            return date.isValid() ? date.format(DATE_FORMAT_INTERNAL) : null;
          });

          dateController.$formatters.push(modelValue => {
            if (modelValue) {
              return moment(modelValue).format(DATE_FORMAT_INTERNAL);
            } else {
              return null;
            }
          });

          dateController.$render = () => {
            elm.find('.date').val(dateController.$viewValue);
            $timeout(() => {
              if (dateController.$modelValue) {
                datepicker.setDate(dateController.$modelValue);
              }
            });
          };

          timeController.$parsers.push(viewValue => {
            const time = parseTimeInput(viewValue);
            if (time) {
              timeController.$setValidity('format', true);
              return time;
            } else {
              timeController.$setValidity('format', false);
            }
          });

          function changeHandler() {
            const value = buildIsoString(
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
          function buildIsoString(localDate, localTime, ampm, tzOffset) {
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
          scope.setFromISO = iso => {
            const tokens = parseIso(iso);
            let tzOffset = LOCAL_TIMEZONE;

            if (tokens) {
              const dateTime = tokens.tzString ? moment(iso).utcOffset(iso) : moment(iso);
              tzOffset = tokens.tzString ? dateTime.format('Z') : scope.tzOffset;
              scope.localDate = dateTime.format(DATE_FORMAT_INTERNAL);
              scope.localTime = tokens.time ? makeLocalTime(tokens.time) : scope.localTime;
              scope.ampm = dateTime.format('a');
            } else {
              scope.localDate = null;
              scope.ampm = 'am';
            }

            scope.tzOffset = scope.hasTimezone ? tzOffset : null;
          };

          scope.$watch(
            () => !ngModelCtrl.$modelValue && !_.isEmpty(timeController.$modelValue),
            invalid => {
              scope.dateInvalid = invalid;
            }
          );

          scope.$watch(
            () => timeController.$error.format,
            invalid => {
              scope.timeInvalid = invalid;
            }
          );

          function parseIso(isoString) {
            if (!_.isString(isoString) || !moment(isoString).isValid()) {
              return null;
            }

            const results = ISO_8601_RX.exec(isoString);
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
              const m = moment(isoString).zone(isoString);
              if (m.isValid()) {
                let timeFmt = 'HH:mm';
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

          function parseTimeInput(value) {
            const localTimeRx = uses24hMode() ? TIME_RX : TIME_RX_12;
            const inputMatcher = '^\\s*(' + localTimeRx + ')?\\s*$';
            const match = value.match(inputMatcher);
            let time = match && match[1];
            if (time && time.match(/^\d:/)) {
              time = '0' + time;
            }

            return time || null;
          }

          function make24hTime(localTime, ampm) {
            if (uses24hMode()) {
              return localTime;
            }

            const seg = localTime.split(':');
            let hour = parseInt(seg[0], 10);
            hour = ampm === 'am' && hour === 12 ? 0 : ampm === 'pm' && hour < 12 ? hour + 12 : hour;
            seg[0] = hour === 0 ? '00' : hour < 10 ? '0' + String(hour) : String(hour);
            return seg.join(':');
          }

          function makeLocalTime(timeStr) {
            if (uses24hMode()) {
              return timeStr;
            }

            const seg = timeStr.split(':');
            let hour = parseInt(seg[0], 10);
            hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            seg[0] = hour === 0 ? '00' : hour < 10 ? '0' + String(hour) : String(hour);
            return seg.join(':');
          }

          function uses24hMode() {
            return _.get(scope, 'widget.settings.ampm') !== '12';
          }
        }
      };
    }
  ]);
}
