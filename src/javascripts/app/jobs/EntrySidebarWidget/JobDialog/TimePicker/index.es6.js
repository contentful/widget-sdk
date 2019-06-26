import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { isNaN } from 'lodash';
import {
  Select,
  HelpText,
  FormLabel,
  ValidationMessage,
  Option
} from '@contentful/forma-36-react-components';
import styles from './styles.es6';
import { getPreferredTimeFormat, TimeFormat } from './TimeFormatDetector.es6';

const pad = n => {
  const nValue = Number.parseInt(n, 10);
  if (nValue < 10) {
    return `0${nValue}`;
  } else {
    return n;
  }
};

export function TimePicker({ helpText, validationMessage, onChange, onBlur, value }) {
  const momentValue = moment(value, 'HH:mm').local();

  const preferredTimeFormat = getPreferredTimeFormat();
  const [timeFormat, setTimeFormat] = useState(momentValue.format('A'));

  const minutes = momentValue.format('m');
  const hours = momentValue.format(preferredTimeFormat);

  const handleChange = results => {
    let inputFormat;
    if (preferredTimeFormat === TimeFormat.H24) {
      inputFormat = moment(`${results.hours}:${results.minutes}`, 'HH:mm');
    } else {
      inputFormat = moment(`${results.hours}:${results.minutes} ${results.timeFormat}`, 'hh:mm A');
    }
    onChange(inputFormat.format('HH:mm'));
  };
  return (
    <div className={styles.timePicker}>
      <FormLabel required={true} htmlFor="scheduleTimeForm">
        Time
      </FormLabel>
      <div className={styles.inputWrapper} id="scheduleTimeForm">
        <div className={styles.timeField}>
          <input
            className={styles.timeInput}
            name="hour"
            data-test-id="hours"
            type="number"
            min={preferredTimeFormat === TimeFormat.H12 ? 1 : 0}
            max={preferredTimeFormat === TimeFormat.H12 ? 12 : 23}
            value={pad(hours)}
            onBlur={onBlur}
            onChange={e => {
              let value = parseInt(e.target.value, 10);
              if (isNaN(value)) {
                value = preferredTimeFormat === TimeFormat.H12 ? 12 : 0;
              }
              if (preferredTimeFormat === TimeFormat.H12) {
                value = value === 0 ? 12 : Math.min(value, 12);
              } else {
                value = Math.min(value, 23);
              }
              handleChange({
                hours: pad(value),
                minutes: minutes,
                timeFormat: timeFormat
              });
            }}
          />
          <span>:</span>
          <input
            className={styles.timeInput}
            type="number"
            data-test-id="minutes"
            name="minute"
            onBlur={onBlur}
            value={pad(minutes)}
            min="0"
            max="59"
            onChange={e => {
              handleChange({
                hours: hours,
                minutes: pad(Math.min(parseInt(e.target.value, 10), 59)),
                timeFormat: timeFormat
              });
            }}
          />
        </div>
        {preferredTimeFormat === TimeFormat.H12 && (
          <Select
            className={styles.daytimeSelect}
            name="daytime"
            value={timeFormat}
            data-test-id="ampm"
            onBlur={onBlur}
            onChange={e => {
              handleChange({
                hours: hours,
                minutes: minutes,
                timeFormat: e.target.value
              });
              setTimeFormat(e.target.value);
            }}>
            <Option value="AM">AM</Option>
            <Option value="PM">PM</Option>
          </Select>
        )}
      </div>
      {helpText && <HelpText>{helpText}</HelpText>}
      {validationMessage && <ValidationMessage>{validationMessage}</ValidationMessage>}
    </div>
  );
}

TimePicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  required: PropTypes.bool,
  helpText: PropTypes.string,
  validationMessage: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string
};

export default TimePicker;
