import React, { useState, useCallback, useRef } from 'react';
import isHotkey from 'is-hotkey';
import PropTypes from 'prop-types';
import { orderBy } from 'lodash';
import moment from 'moment';
import {
  HelpText,
  FormLabel,
  ValidationMessage,
  Dropdown,
  DropdownListItem,
  DropdownList
} from '@contentful/forma-36-react-components';
import styles from './styles';

const MOMENT_12H_FORMAT = 'h:mm A';
const MOMENT_24H_FORMAT = 'HH:mm';

function createHours() {
  const hours = [];
  for (let hour = 0; hour < 24; hour++) {
    hours.push(
      moment()
        .startOf('day')
        .add({ hour })
    );
    hours.push(
      moment()
        .startOf('day')
        .add({
          hour,
          minute: 30
        })
    );
  }

  return orderBy(hours, time => time.toDate(), 'asc').map(m => m.format(MOMENT_12H_FORMAT));
}

const allHourSuggestions = createHours();

function parseRawInput(raw) {
  const meridiem = moment().format('A');
  // In case an input value has no meridiem we'll add current meridiem
  const normalisedValue = /[ap]m/gi.test(raw) ? raw : `${raw} ${meridiem}`;
  return moment(normalisedValue, ['HH:mm', 'h:mm A', 'hh:mm', 'k:mm', 'kk:mm']);
}

function roundDate(date, duration, method) {
  return moment(Math[method](+date / +duration) * +duration);
}

function roundToHalfHour(value, method = 'ceil') {
  const roundedTime =
    moment(value, MOMENT_24H_FORMAT).minutes() % 30 !== 0
      ? moment(roundDate(moment(value, MOMENT_24H_FORMAT), moment.duration(30, 'minutes'), method))
      : moment(value, MOMENT_24H_FORMAT)[method === 'ceil' ? 'add' : 'subtract'](0.5, 'hours');

  return roundedTime.isAfter(moment.now())
    ? roundedTime.format(MOMENT_12H_FORMAT)
    : moment(value, MOMENT_24H_FORMAT).format(MOMENT_12H_FORMAT);
}

function getSuggestionList(value, date) {
  const before = [];
  const after = [];
  allHourSuggestions.forEach(m => {
    if (
      moment(m, MOMENT_12H_FORMAT).isBefore(moment(value, MOMENT_24H_FORMAT).subtract(1, 'hours'))
    ) {
      before.push(m);
    } else {
      after.push(m);
    }
  });

  return after
    .concat(before)
    .filter(time => moment(`${date} ${time}`, `YYYY-MM-DD ${MOMENT_12H_FORMAT}`).isAfter(moment()));
}

export function TimePicker({ value, date, helpText, validationMessage, onChange, onBlur }) {
  const [isTimeSuggestionOpen, setTimeSuggestionOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(
    moment(value, MOMENT_24H_FORMAT).format(MOMENT_12H_FORMAT)
  );
  const [dropdownContainer, setDropdownContainer] = useState(null);
  const inputRef = useRef(null);

  const getTimeFromUserInputOrDefaultToValue = useCallback(() => {
    const parsedTime = parseRawInput(selectedTime);
    if (parsedTime.isValid()) {
      return parsedTime.format(MOMENT_12H_FORMAT);
    } else {
      return moment(value, MOMENT_24H_FORMAT).format(MOMENT_12H_FORMAT);
    }
  }, [selectedTime, value]);

  const closeDropdown = useCallback(
    event => {
      if (dropdownContainer) {
        const parent = dropdownContainer;
        const activeElement = event.relatedTarget || document.activeElement;
        if (activeElement === document.body) {
          inputRef.current.focus();
          return null;
        }

        const isDropdownListFocused = activeElement === parent || parent.contains(activeElement);

        if (!isDropdownListFocused) {
          setTimeSuggestionOpen(false);
        }
      }
    },
    [dropdownContainer]
  );

  const handleChange = useCallback(
    val => {
      setSelectedTime(val);

      const parsedTime = parseRawInput(val);
      if (parsedTime.isValid()) {
        const time24H = parsedTime.format(MOMENT_24H_FORMAT);

        onChange(time24H);
      }
    },
    [onChange]
  );

  const handleKeyUp = useCallback(
    event => {
      if (isHotkey('arrowUp', event)) {
        handleChange(roundToHalfHour(value, 'floor'));
      }
      if (isHotkey('arrowDown', event)) {
        handleChange(roundToHalfHour(value, 'ceil'));
      }
      if (isHotkey('enter', event)) {
        setTimeSuggestionOpen(false);
      }
    },
    [value, handleChange]
  );

  const handleKeyDown = useCallback(event => {
    if (isHotkey('arrowUp', event) || isHotkey('arrowDown', event)) {
      event.preventDefault();
    }
  }, []);

  const handleFocus = useCallback(e => {
    e.preventDefault();
    e.target.select();
    setTimeSuggestionOpen(true);
  }, []);

  const handleBlur = useCallback(
    e => {
      const time = getTimeFromUserInputOrDefaultToValue();
      setSelectedTime(time);
      closeDropdown(e);
      onBlur();
    },
    [getTimeFromUserInputOrDefaultToValue, setSelectedTime, closeDropdown, onBlur]
  );

  const filteredHours = getSuggestionList(value, date);

  return (
    <div className={styles.timePicker}>
      <FormLabel required={true} htmlFor="scheduleTimeForm">
        Time
      </FormLabel>
      <div className={styles.inputWrapper} id="scheduleTimeForm">
        <Dropdown
          className={styles.dropdown}
          dropdownContainerClassName={styles.dropdownContainer}
          getContainerRef={setDropdownContainer}
          toggleElement={
            <input
              ref={inputRef}
              className={styles.timeInput}
              name="time input"
              data-test-id="time"
              value={selectedTime}
              onKeyUp={handleKeyUp}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={e => handleChange(e.target.value)}
            />
          }
          isOpen={isTimeSuggestionOpen}>
          <DropdownList maxHeight={200}>
            {filteredHours.map(hour => {
              return (
                <DropdownListItem
                  testId="time-suggestion"
                  className={
                    moment(value, MOMENT_24H_FORMAT).format(MOMENT_12H_FORMAT) === hour
                      ? styles.selectedTime
                      : null
                  }
                  onClick={() => {
                    handleChange(hour);
                    setTimeSuggestionOpen(false);
                  }}
                  key={hour}>
                  {hour}
                </DropdownListItem>
              );
            })}
          </DropdownList>
        </Dropdown>
        {helpText && <HelpText>{helpText}</HelpText>}
        {validationMessage && <ValidationMessage>{validationMessage}</ValidationMessage>}
      </div>
    </div>
  );
}

TimePicker.propTypes = {
  value: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  required: PropTypes.bool,
  helpText: PropTypes.string,
  validationMessage: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string
};

TimePicker.defaultProps = {
  onBlur: () => {}
};

export default TimePicker;
