import moment from 'moment';
import { h } from 'ui/Framework';
import * as H from 'ui/Framework/Hooks';
import DatePicker from 'datepicker';


const DATE_FORMAT = 'YYYY-MM-DD';

const DatePickerHook = H.makeHook((el, datePicker, _prevOnChange, onChange) => {
  if (el) {
    if (!datePicker) {
      datePicker = DatePicker.create({
        field: el,
        onSelect: function () {
          onChange(this.getMoment().toISOString());
        },
        firstDay: 1,
        theme: 'search__datepicker'
      });
    }
    return datePicker;
  } else if (datePicker) {
    datePicker.destroy();
  }
});

export default function filterValueDate ({ testId, value, inputRef, onChange, onKeyDown }) {
  const formattedDate = getFormattedDate(value);

  return h('input.input-reset.search__input-text', {
    dataTestId: testId,
    hooks: [DatePickerHook(onChange), H.Ref(el => el && inputRef(el))],
    onKeyDown,
    value: formattedDate,
    tabindex: '0',
    style: {
      width: getWidth(formattedDate)
    },
    readonly: true
  });
}

function getFormattedDate (value) {
  let date = '';
  if (value) {
    date = moment(value, moment.ISO_8601).format(DATE_FORMAT);
  }
  return date;
}

function getWidth (value) {
  if (value) {
    return `calc(${value.length}ch + 20px)`;
  } else {
    return '100px';
  }
}
