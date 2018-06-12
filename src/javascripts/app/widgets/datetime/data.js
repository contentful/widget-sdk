'use strict';

angular.module('cf.app')

/**
 * @ngdoc service
 * @module cf.app
 * @name widget/datetime/data
 * @description
 * Collection of function to manipulate view data for the datetime
 * editor.
 */
.factory('widgets/datetime/data', ['require', require => {
  var moment = require('moment');

  var ZONE_RX = /(Z|[+-]\d{2}[:+]?\d{2})$/;
  var TIME_24_RX = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
  var TIME_12_RX = /^([0]?[1-9]|10|11|12):([0-5][0-9])(:[0-5][0-9])?$/;

  // All formats that we try when parsing free-form date input from the user.
  var DATE_INPUT_FORMATS = [
    'YYYY-MM-DD',
    'DD-MM-YYYY',
    'DD.MM.YYYY',
    'dddd, MMMM Do YYYY',
    'l', 'L',
    'll', 'LL'
  ];

  return {
    formatDateDisplay: formatDateDisplay,
    parseFreeFormDate: parseFreeFormDate,
    userInputFromDatetime: userInputFromDatetime,
    buildFieldValue: buildFieldValue,
    validate12hTime: validate12hTime,
    validate24hTime: validate24hTime
  };


  function validate12hTime (time) {
    if (time) {
      return TIME_12_RX.test(time);
    } else {
      return true;
    }
  }

  function validate24hTime (time) {
    if (time) {
      return TIME_24_RX.test(time);
    } else {
      return true;
    }
  }

  /**
   * @ngdoc method
   * @name widget/datetime/data#parseFreeFormDate
   * @description
   * Parse user input into moment date. If the input is the empty
   * string returns `null`.
   *
   * @param {string} date
   * @returns {moment|null}
   */
  function parseFreeFormDate (dateString) {
    if (!dateString) {
      return null;
    }

    var date = moment.utc(dateString, DATE_INPUT_FORMATS);

    if (date.isValid()) {
      return date;
    } else {
      return moment(new Date(dateString));
    }
  }


  /**
   * @ngdoc method
   * @name widget/datetime/data#buildFieldValue
   * @description
   * Parse user input into a string that is stored in the API.
   *
   * Returns a sum type with either the string as the `valid` property
   * or the `invalid` property set to `false`.
   *
   * @param {DatetimeInput} input
   * Has 'date', 'time', 'ampm', and 'timezone' properties
   * @param {boolean} parse12hClock
   * @param {boolean} useTime
   * @param {boolean} useTimezone
   * @returns {{valid: string|null}|{invalid: boolean}}}
   */
  function buildFieldValue (data, parse12hClock, useTime, useTimezone) {
    var date = datetimeFromUserInput(data, parse12hClock);
    if (date.invalid || date.valid === null) {
      return date;
    }

    var format;
    if (useTimezone) {
      format = 'YYYY-MM-DDTHH:mmZ';
    } else if (useTime) {
      format = 'YYYY-MM-DDTHH:mm';
    } else {
      format = 'YYYY-MM-DD';
    }
    return {valid: date.valid.format(format)};
  }

  /**
   * @ngdoc method
   * @name widget/datetime/data#datetimeFromUserInput
   * @description
   * Convert the user input object into either a 'moment' value or an
   * invalid symbol.
   *
   * Success is indicated by returning '{valid: value}' and failure is
   * indicated by returning '{invalid: true}'. If 'input.date' is
   * 'null' we return '{valid: null}'
   *
   * @param {DatetimeInput} input
   * Has 'date', 'time', 'ampm', and 'timezone' properties
   * @param {boolean} uses12hclock
   * How to parse 'input.time' and 'input.ampm'
   * @returns {{valid: moment|null}|{invalid: boolean}}}
   */
  function datetimeFromUserInput (input, uses12hClock) {
    if (!input.date) {
      return {valid: null};
    }

    var time = timeFromUserInput(input, uses12hClock);

    var date =
      moment.parseZone(input.utcOffset, 'Z')
      .set(input.date.toObject())
      .set({hours: time.hours(), minutes: time.minutes()});

    if (date.isValid()) {
      return {valid: date};
    } else {
      return {invalid: true};
    }
  }

  function timeFromUserInput (input, uses12hClock) {
    var timeInput = input.time || '00:00';
    if (uses12hClock) {
      return moment.utc(timeInput + '!' + input.ampm, 'HH:mm!A');
    } else {
      return moment.utc(timeInput, 'HH:mm');
    }
  }

  /**
   * @ngdoc method
   * @name widget/datetime/data#userInputFromDatetime
   * @description
   * Create the user input object from the field value.
   *
   * @param {string} datetime
   * @param {boolean} use12hClock
   * @returns {DateTimeInput}
   */
  function userInputFromDatetime (datetimeString, use12hClock) {
    var datetime = fieldValueToMoment(datetimeString);

    if (datetime) {
      var timeFormat = use12hClock ? 'hh:mm' : 'HH:mm';
      return {
        date: datetime,
        time: datetime.format(timeFormat),
        ampm: datetime.format('A'),
        utcOffset: datetime.format('Z')
      };
    } else {
      return {
        ampm: startOfToday('A'),
        utcOffset: startOfToday('Z')
      };
    }
  }

  function fieldValueToMoment (datetimeString) {
    if (!datetimeString) {
      return null;
    }

    var datetime = moment(datetimeString);
    if (ZONE_RX.test(datetimeString)) {
      datetime.utcOffset(datetimeString);
    }
    return datetime;
  }

  function startOfToday (format) {
    return moment().set({hours: 0, minutes: 0}).format(format);
  }

  function formatDateDisplay (date) {
    if (date) {
      return date.format('dddd, MMMM Do YYYY');
    } else {
      return '';
    }
  }
}]);
