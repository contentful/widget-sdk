import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CheckboxField, ValidationMessage, TextField } from '@contentful/forma-36-react-components';
import { toString } from 'lodash';
import Datepicker from '@contentful/forma-36-react-datepicker';
import Timepicker from '@contentful/forma-36-react-timepicker';
import UTCTimeZonePicker from './components/UTCTimeZonePicker';
import { cx } from 'emotion';
import styles from './styles';
import moment from 'moment';

const ValidationRow = ({ date: fullDate, onDateUpdate, checkboxLabel, id }) => {
  const [isChecked, setChecked] = useState(() => (fullDate ? true : false));
  const [date, setDate] = useState(() =>
    fullDate ? new Date(moment.parseZone(fullDate).format('YYYY-MM-DDTHH:mm:ss')) : ''
  );
  const [time, setTime] = useState(() =>
    fullDate ? moment.parseZone(fullDate).format('HH:mm') : ''
  );
  const [timeZone, setTimeZone] = useState(() =>
    fullDate ? moment.parseZone(fullDate).format('Z') : ''
  );

  useEffect(() => {
    if (moment(date).isValid()) {
      let updatedDate;
      updatedDate = moment.parseZone(date).format('YYYY-MM-DDT');
      if (time) {
        updatedDate = updatedDate + '00' + timeZone;
      }
      onDateUpdate(updatedDate);
    }
  }, [date, time, timeZone, onDateUpdate]);

  return (
    <div className={cx(styles.validationRow, styles.flexAlignStart)}>
      <CheckboxField
        className={styles.checkbox}
        labelText={checkboxLabel}
        name={`${id} value checkbox`}
        checked={isChecked}
        onChange={() => setChecked(!isChecked)}
        labelIsLight={true}
        id={`${id}-value-checkbox`}
      />
      <Datepicker
        labelText="Date"
        id={`${id}-data-picker`}
        disabled={!isChecked}
        value={date}
        dateFormat="yyyy-MM-dd"
        onChange={setDate}
      />
      <Timepicker
        labelText="Time"
        id={`${id}-time-picker`}
        disabled={!isChecked}
        date={date}
        value={time}
        onChange={setTime}
      />
      <UTCTimeZonePicker
        value={timeZone}
        disabled={!isChecked}
        onChange={(value) => setTimeZone(value)}
      />
    </div>
  );
};

ValidationRow.propTypes = {
  date: PropTypes.string,
  id: PropTypes.string.isRequired,
  onDateUpdate: PropTypes.func.isRequired,
  checkboxLabel: PropTypes.string.isRequired,
};

const DateRangeValidation = ({
  validation,
  updateValidationSettingsValue,
  updateValidationMessageValue,
  errorMessages,
}) => {
  const [minDate, setMinDate] = useState(validation.settings.min);
  const [maxDate, setMaxDate] = useState(validation.settings.max);
  const [message, setMessage] = useState(validation.message);

  useEffect(() => {
    updateValidationSettingsValue({ min: minDate, max: maxDate });
  }, [minDate, maxDate, updateValidationSettingsValue]);

  useEffect(() => {
    updateValidationMessageValue(message);
  }, [message, updateValidationMessageValue]);

  return (
    <>
      <ValidationRow
        id={'min'}
        checkboxLabel={'Later than'}
        date={minDate}
        onDateUpdate={setMinDate}
      />
      <ValidationRow
        id={'max'}
        checkboxLabel={'Earlier than'}
        date={maxDate}
        onDateUpdate={setMaxDate}
      />
      {errorMessages[0] && <ValidationMessage>{errorMessages[0]}</ValidationMessage>}
      <TextField
        className={styles.marginTopS}
        name="Custom error message"
        id="customErrorMessage"
        labelText="Custom error message"
        value={toString(message)}
        textInputProps={{ type: 'text' }}
        onChange={({ target: { value } }) => setMessage(value)}
      />
    </>
  );
};

DateRangeValidation.propTypes = {
  validation: PropTypes.object.isRequired,
  updateValidationSettingsValue: PropTypes.func.isRequired,
  updateValidationMessageValue: PropTypes.func.isRequired,
  errorMessages: PropTypes.array.isRequired,
};

export default DateRangeValidation;
