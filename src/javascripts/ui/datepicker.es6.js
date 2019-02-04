import { registerService } from 'NgRegistry.es6';
import Pikaday from 'pikaday';
import _ from 'lodash';

export default function register() {
  /**
   * @ngdoc service
   * @module cf.ui
   * @name datepicker
   * @usage[js]
   * var createDatepicker = require('datepicker').create
   * var datePicker = createDatepicker({
   *   // same API as Pikaday
   * })
   */
  registerService('datepicker', () => {
    const I18N = {
      previousMonth: 'Previous Month',
      nextMonth: 'Next Month',
      months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      weekdaysShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };

    const DEFAULTS = {
      i18n: I18N,
      yearRange: 100
    };

    return {
      create: function(opts) {
        return new Pikaday(_.assign({}, DEFAULTS, opts));
      }
    };
  });
}
