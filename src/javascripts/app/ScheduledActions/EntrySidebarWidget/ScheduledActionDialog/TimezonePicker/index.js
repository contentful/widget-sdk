import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import _ from 'lodash';
import { FormLabel } from '@contentful/forma-36-react-components';
import { Autocomplete } from '@contentful/forma-36-react-components/dist/alpha';
import styles from './styles';
import { cx } from 'emotion';
import allTimezones from './Timezones';

export function TimezonePicker({ validationMessage, onSelect, disabled, className }) {
  const defaultTimezone = allTimezones.find((timezone) => timezone.ianaName === moment.tz.guess());

  const [filteredTimezones, setFilteredTimezones] = useState(allTimezones);
  const [userInput, setUserInput] = useState(defaultTimezone);

  const handleSelect = useCallback(
    (timezone) => {
      onSelect(timezone.ianaName);
      setFilteredTimezones(allTimezones);
      setUserInput(timezone);
    },
    [onSelect]
  );

  const handleChange = (val) => {
    const newFilteredTimezones = allTimezones.filter(
      (timezones) => timezones.displayValue.toLowerCase().indexOf(val.toLowerCase()) !== -1
    );
    setFilteredTimezones(newFilteredTimezones.length > 0 ? newFilteredTimezones : allTimezones);
  };

  return (
    <div
      className={className ? cx(styles.timezonePicker, className) : styles.timezonePicker}
      data-test-id="timezone-picker">
      <FormLabel htmlFor="scheduleTimezoneForm">Timezone</FormLabel>
      <div className={styles.inputWrapper} id="scheduleTimezoneForm">
        <Autocomplete
          disabled={disabled}
          maxHeight={300}
          width="full"
          className={styles.dropdown}
          willClearQueryOnClose
          dropdownProps={{
            isFullWidth: true,
          }}
          items={filteredTimezones.slice(0, 100)}
          onChange={handleSelect}
          onQueryChange={handleChange}
          placeholder={userInput.displayValue}
          validationMessage={validationMessage}
          emptyListMessage="There are no timezones to choose from"
          noMatchesMessage="No timezones found">
          {(options) =>
            options.map((option) => <span key={option.ianaName}>{option.displayValue}</span>)
          }
        </Autocomplete>
      </div>
    </div>
  );
}

TimezonePicker.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  required: PropTypes.bool,
  helpText: PropTypes.string,
  validationMessage: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

TimezonePicker.defaultProps = {
  onBlur: () => {},
  onSelect: () => {},
};

export default TimezonePicker;
