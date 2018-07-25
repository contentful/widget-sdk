'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfEntryDatetimeEditor
 */
.directive('cfEntryDatetimeEditor', ['require', require => {
  const moment = require('moment');
  const zoneOffsets = require('zoneOffsets');
  const Datepicker = require('datepicker');
  const Data = require('widgets/datetime/data');
  const $timeout = require('$timeout');

  const ERRORS = {
    timeFormat: {
      message: 'Time is not in a valid format',
      code: 'datetime.time-parse-error'
    },
    dateFormat: {
      message: 'Unable to determine date from input',
      code: 'datetime.date-parse-error'
    }
  };

  return {
    restrict: 'E',
    scope: {},
    require: '^cfWidgetApi',
    template: JST.cf_entry_datetime_editor(),
    link: function ($scope, $el, _$attrs, widgetApi) {
      const settings = widgetApi.settings || {};
      const field = widgetApi.field;
      const dateInputEl = $el.find('[name="datetime.date"]');
      const timeInputEl = $el.find('[name="datetime.time"]');

      $scope.usesTime = settings.format !== 'dateonly';
      $scope.usesTimezone = settings.format === 'timeZ';
      $scope.uses12hClock = settings.ampm === '12';
      $scope.zoneOffsets = zoneOffsets;
      $scope.data = {};

      const validateTime = $scope.uses12hClock ? Data.validate12hTime : Data.validate24hTime;
      const timeController = timeInputEl.controller('ngModel');
      timeController.$validators.timeFormat = validateTime;

      const dateController = dateInputEl.controller('ngModel');
      dateController.$formatters.push(Data.formatDateDisplay);
      dateController.$parsers.push(Data.parseFreeFormDate);
      dateController.$validators.dateFormat = date => date ? date.isValid() : true;

      // We replace the parsed user date with the normalized date when
      // the date input is blurred.
      dateController.$viewChangeListeners.push(() => {
        if (dateController.$valid) {
          dateController.$viewValue = Data.formatDateDisplay(dateController.$modelValue);
          dateController.$render();
        }
      });

      const offValueChanged = field.onValueChanged(datetime => {
        $scope.data = Data.userInputFromDatetime(datetime, $scope.uses12hClock);
      });

      const offDisabledStatusChanged = field.onIsDisabledChanged(isDisabled => {
        $scope.isDisabled = isDisabled;
      });

      $scope.$watch(() => dateController.$valid && timeController.$valid, isValid => {
        field.setInvalid(!isValid);
      });

      const datepicker = Datepicker.create({
        field: $el.find('[data-datepicker-slot]').get(0),
        trigger: dateInputEl.get(0),
        onSelect: function (date) {
          $scope.$apply(() => {
            $scope.data.date = moment(date);
            setValueFromInputData();
          });
          dateInputEl.blur();
        }
      });

      $scope.$watch(() => $scope.data.date, date => {
        if (date) {
          datepicker.setMoment(date, true);
        }
      });

      $scope.focusDateInput = () => {
        // We delay this so that any click events that close the
        // datepicker are handled before.
        $timeout(() => {
          dateInputEl.focus();
        });
      };

      $scope.$on('$destroy', () => {
        offValueChanged();
        offDisabledStatusChanged();
        datepicker.destroy();
      });

      // This is emitted whenever the user changes on of the input fields.
      $scope.$on('ngModel:update', setValueFromInputData);

      function setValueFromInputData () {
        if (!$scope.data.date) {
          $scope.data.time = null;
        }
        // Prevent calling the datepicker’s `onSelect` method which
        // would lead to an infinite loop.
        datepicker.setMoment($scope.data.date, true);

        const value = Data.buildFieldValue(
          $scope.data,
          $scope.uses12hClock, $scope.usesTime, $scope.usesTimezone
        );
        if (value.valid === null) {
          field.removeValue();
        } else if (value.valid) {
          field.setValue(value.valid);
        }
      }

      $scope.$watchCollection(() => [].concat(
        Object.keys(dateController.$error),
        Object.keys(timeController.$error)
      ), errors => {
        $scope.errors = _.transform(errors, (errors, key) => {
          if (key in ERRORS) {
            errors.push(ERRORS[key]);
          }
        }, []);
      });
    }
  };
}]);
