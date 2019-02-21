import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import * as DatePicker from 'ui/datepicker.es6';

const DATE_FORMAT = 'YYYY-MM-DD';

function getFormattedDate(value) {
  if (value) {
    return moment(value, moment.ISO_8601).format(DATE_FORMAT);
  }
  return '';
}

function getWidth(value) {
  if (value) {
    return `calc(${value.length}ch + 20px)`;
  } else {
    return '100px';
  }
}

export default class Date extends React.Component {
  static propTypes = {
    testId: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    inputRef: PropTypes.func.isRequired
  };

  inputRef = null;
  datePicker = null;

  componentDidMount() {
    const onChange = this.props.onChange;
    if (this.inputRef) {
      const datePicker = DatePicker.create({
        field: this.inputRef,
        container: this.inputRef.parentElement,
        yearRange: [
          1900,
          moment()
            .add(10, 'years')
            .year()
        ],
        // don't change this function to arrow function
        // this.getMoment is function of DatePicker object
        onSelect: function() {
          onChange(this.getMoment().format(DATE_FORMAT));
        },
        onOpen: function() {
          // HACK: we prevent all the butons from getting kb focused (with tab)
          // otherwise the widget will collapses.
          for (const el of datePicker.el.querySelectorAll('button')) {
            el.setAttribute('tabindex', '-1');
          }
        },
        firstDay: 1,
        theme: 'search__datepicker'
      });

      this.datePicker = datePicker;
    }
  }

  componentWillUnmount() {
    if (this.datePicker) {
      this.datePicker.destroy();
      this.datePicker = null;
    }
  }

  render() {
    const { testId, value, onKeyDown, inputRef } = this.props;
    const formattedDate = getFormattedDate(value);

    return (
      <div style={{ position: 'relative', display: 'flex', width: getWidth(formattedDate) }}>
        <input
          ref={el => {
            this.inputRef = el;
            inputRef(el);
          }}
          data-test-id={testId}
          onKeyDown={onKeyDown}
          value={formattedDate}
          className="input-reset search__input-text"
          tabIndex="0"
          style={{
            width: getWidth(formattedDate),
            paddingLeft: '10px'
          }}
          readOnly
        />
      </div>
    );
  }
}
