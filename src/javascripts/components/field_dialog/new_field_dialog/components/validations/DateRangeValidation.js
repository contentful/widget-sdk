import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import { CheckboxField, ValidationMessage, TextField } from '@contentful/forma-36-react-components';
import { toString } from 'lodash';
import Datepicker from '@contentful/forma-36-react-datepicker';
import Timepicker from '@contentful/forma-36-react-timepicker';
import UTCTimeZonePicker from 'components/field_dialog/validations/components/UTCTimeZonePicker';
import { cx } from 'emotion';
import styles from './styles';
import moment from 'moment';
import { ValidationFieldType } from 'components/field_dialog/new_field_dialog/utils/PropTypes';

const ValidationRow = ({ date: fullDate, onDateUpdate, checkboxLabel, id, onBlur }) => {
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

  const onDateChange = (date) => {
    setDate(date);
    if (moment(date).isValid()) {
      let updatedDate;
      updatedDate = moment.parseZone(date).format('YYYY-MM-DD');
      if (time) {
        updatedDate = updatedDate + 'T' + time + timeZone;
      }
      onDateUpdate(updatedDate);
    }
  };
  const onTimeChange = (time) => {
    setTime(time);
    if (moment(date).isValid()) {
      let updatedDate;
      updatedDate = moment.parseZone(date).format('YYYY-MM-DD');
      if (time) {
        updatedDate = updatedDate + 'T' + time + timeZone;
      }
      onDateUpdate(updatedDate);
    }
  };

  const onTimeZoneChange = (timeZone) => {
    setTimeZone(timeZone);
    if (moment(date).isValid()) {
      let updatedDate;
      updatedDate = moment.parseZone(date).format('YYYY-MM-DD');
      if (time) {
        updatedDate = updatedDate + 'T' + time + timeZone;
      }
      onDateUpdate(updatedDate);
    }
  };

  return (
    <div className={cx(styles.validationRow, styles.flexAlignStart)}>
      <CheckboxField
        className={styles.checkbox}
        labelText={checkboxLabel}
        name={`${id}-value-checkbox`}
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
        onChange={onDateChange}
        onBlur={onBlur}
      />
      <Timepicker
        labelText="Time"
        id={`${id}-time-picker`}
        disabled={!isChecked}
        date={date}
        value={time}
        onChange={onTimeChange}
        onBlur={onBlur}
      />
      <UTCTimeZonePicker
        value={timeZone}
        disabled={!isChecked}
        onChange={(value) => onTimeZoneChange(value)}
      />
    </div>
  );
};

ValidationRow.propTypes = {
  date: PropTypes.string,
  id: PropTypes.string.isRequired,
  onDateUpdate: PropTypes.func.isRequired,
  checkboxLabel: PropTypes.string.isRequired,
  onBlur: PropTypes.func.isRequired,
};

const DateRangeValidation = ({ validation, onChange, onBlur }) => {
  const { name, helpText, type, message, settings, enabled } = validation.value;
  const onChangeSettings = (settings) => onChange(type, { ...validation.value, settings });

  return (
    <div>
      <CheckboxField
        className={styles.marginBottomS}
        labelText={name}
        helpText={helpText}
        id={`field-validations--${type}`}
        checked={enabled}
        onChange={(e) =>
          onChange(type, {
            ...validation.value,
            enabled: e.target.checked,
          })
        }
      />
      {enabled && (
        <Fragment>
          <ValidationRow
            id={'min'}
            checkboxLabel={'Later than'}
            date={settings.min}
            onDateUpdate={(min) => onChangeSettings({ ...settings, min })}
            onBlur={() => onBlur(type)}
          />
          <ValidationRow
            id={'max'}
            checkboxLabel={'Earlier than'}
            date={settings.max}
            onDateUpdate={(max) => onChangeSettings({ ...settings, max })}
            onBlur={() => onBlur(type)}
          />
          {validation.error && (
            <ValidationMessage className={styles.validationMessage}>
              {validation.error}
            </ValidationMessage>
          )}
          <TextField
            className={styles.helpTextInput}
            name="Custom error message"
            id={`custom-error-message-${type}`}
            labelText="Custom error message"
            value={toString(message)}
            textInputProps={{ type: 'text' }}
            onChange={({ target: { value } }) =>
              onChange(type, { ...validation.value, message: value })
            }
          />
        </Fragment>
      )}
    </div>
  );
};

DateRangeValidation.propTypes = {
  validation: PropTypes.shape(ValidationFieldType).isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

export default DateRangeValidation;
