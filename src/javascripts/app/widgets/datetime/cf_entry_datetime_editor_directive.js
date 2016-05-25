'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @moduel cf.app
 * @name cfEntryDatetimeEditor
 */
.directive('cfEntryDatetimeEditor', ['$injector', function ($injector) {
  var moment = $injector.get('moment');
  var zoneOffsets = $injector.get('zoneOffsets');
  var Datepicker = $injector.get('datepicker');
  var Data = $injector.get('widgets/datetime/data');
  var $timeout = $injector.get('$timeout');

  var ERRORS = {
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
      var settings = widgetApi.settings || {};
      var field = widgetApi.field;
      var dateInputEl = $el.find('[name="datetime.date"]');
      var timeInputEl = $el.find('[name="datetime.time"]');

      $scope.usesTime = settings.format !== 'dateonly';
      $scope.usesTimezone = settings.format === 'timeZ';
      $scope.uses12hClock = settings.ampm === '12';
      $scope.zoneOffsets = zoneOffsets;
      $scope.data = {};

      var validateTime = $scope.uses12hClock ? Data.validate12hTime : Data.validate24hTime;
      var timeController = timeInputEl.controller('ngModel');
      timeController.$validators.timeFormat = validateTime;

      var dateController = dateInputEl.controller('ngModel');
      dateController.$formatters.push(Data.formatDateDisplay);
      dateController.$parsers.push(Data.parseFreeFormDate);
      dateController.$validators.dateFormat = function (date) {
        return date ? date.isValid() : true;
      };

      // We replace the parsed user date with the normalized date when
      // the date input is blurred.
      dateController.$viewChangeListeners.push(function () {
        if (dateController.$valid) {
          dateController.$viewValue = Data.formatDateDisplay(dateController.$modelValue);
          dateController.$render();
        };
      });

      var offValueChanged = field.onValueChanged(function (datetime) {
        $scope.data = Data.userInputFromDatetime(datetime, $scope.uses12hClock);
      });

      var offDisabledStatusChanged = field.onDisabledStatusChanged(function (isDisabled) {
        $scope.isDisabled = isDisabled;
      });

      var datepicker = Datepicker.create({
        field: $el.find('[data-datepicker-slot]').get(0),
        trigger: dateInputEl.get(0),
        onSelect: function (date) {
          $scope.$apply(function () {
            $scope.data.date = moment(date);
          });
          dateInputEl.blur();
        }
      });

      $scope.focusDateInput = function () {
        // We delay this so that any click events that close the
        // datepicker are handled before.
        $timeout(function () {
          dateInputEl.focus();
        });
      };

      $scope.$on('$destroy', function () {
        offValueChanged();
        offDisabledStatusChanged();
        datepicker.destroy();
      });

      // This is emitted whenever the user changes on of the input fields.
      $scope.$on('ngModel:update', function () {
        if (!$scope.data.date) {
          $scope.data.time = null;
        }
        // Prevent calling the datepicker’s `onSelect` method which
        // would lead to an infinite loop.
        datepicker.setMoment($scope.data.date, true);

        var value = Data.buildFieldValue(
          $scope.data,
          $scope.uses12hClock, $scope.usesTime, $scope.usesTimezone
        );
        if (value.valid === null) {
          field.removeValue();
        } else if (value.valid) {
          field.setValue(value.valid);
        }
      });

      $scope.$watchCollection(function () {
        return [].concat(
          Object.keys(dateController.$error),
          Object.keys(timeController.$error)
        );
      }, function (errors) {
        $scope.errors = _.transform(errors, function (errors, key) {
          if (key in ERRORS) {
            errors.push(ERRORS[key]);
          }
        }, []);
      });
    }
  };
}]);
