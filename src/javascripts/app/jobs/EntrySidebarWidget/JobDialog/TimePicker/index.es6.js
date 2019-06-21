import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {
  Select,
  HelpText,
  FormLabel,
  ValidationMessage,
  Option
} from '@contentful/forma-36-react-components';
import styles from './styles.es6';

const AMPM = 'h';
const TWENTYFOUR = 'HH';

const getTimeFormatByLocale = () => {
  return TWENTYFOUR;
  // if (!navigator) {
  //   return TWENTYFOUR;
  // }
  // const language = navigator.languages != undefined ? navigator.languages[0] : navigator.language;
  // if (!language) {
  //   return TWENTYFOUR;
  // }
  // return navigator.language === 'en-GB' || navigator.language === 'en-US' ? AMPM : TWENTYFOUR;
};

// const pad = n => (n < 10 ? '0' + n : n);

export function TimePicker({ labelText = 'Time', helpText, validationMessage, onChange, value }) {
  const momentValue = moment(value, 'HH:mm').local();

  const timeFormat = getTimeFormatByLocale();
  const [daytime, setDaytime] = useState(momentValue.format('A'));

  const minutes = momentValue.format('m');
  const hours = momentValue.format(timeFormat);

  const handleChange = results => {
    onChange(`${results.hours}:${results.minutes}`);
  };
  return (
    <div className={styles.timePicker}>
      <FormLabel required={true} htmlFor="scheduleTimeForm">
        {labelText}
      </FormLabel>
      <div className={styles.inputWrapper} id="scheduleTimeForm">
        <div className={styles.timeField}>
          <input
            className={styles.timeInput}
            name="hour"
            type="number"
            min="0"
            max="23"
            value={hours}
            onChange={e => {
              handleChange({
                hours: Math.min(Number(e.target.value), 23),
                minutes: minutes,
                timeFormat: timeFormat
              });
            }}
          />
          <span>:</span>
          <input
            className={styles.timeInput}
            type="number"
            name="minute"
            value={minutes}
            min="0"
            max="59"
            onChange={e => {
              handleChange({
                hours: hours,
                minutes: Number(e.target.value),
                timeFormat: timeFormat
              });
            }}
          />
        </div>
        {timeFormat === AMPM && (
          <Select
            className={styles.daytimeSelect}
            name="daytime"
            value={daytime}
            onChange={e => {
              setDaytime(e.target.value);
              handleChange({
                hours: hours,
                minutes: minutes,
                timeFormat: e.target.value
              });
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
  required: PropTypes.bool,
  helpText: PropTypes.string,
  labelText: PropTypes.string,
  validationMessage: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string
};

export default TimePicker;
