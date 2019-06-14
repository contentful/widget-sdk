import React, { Component } from 'react';
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
  if (!navigator) {
    return TWENTYFOUR;
  }
  const language = navigator.languages != undefined ? navigator.languages[0] : navigator.language;
  if (!language) {
    return TWENTYFOUR;
  }
  return navigator.language === 'en-GB' || navigator.language === 'en-US' ? AMPM : TWENTYFOUR;
};

const pad = n => (n < 10 ? '0' + n : n);

class TimeField extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    time: PropTypes.shape({
      hour: PropTypes.number,
      minute: PropTypes.number
    }),
    timeFormat: PropTypes.string
  };

  handleChange = time => {
    const maxHour = this.props.timeFormat === AMPM ? 12 : 24;

    if (time.hour > maxHour || time.minute > 59 || isNaN(time.hour) || isNaN(time.minute)) {
      return null;
    }

    if (maxHour === 24 && time.hour === 24 && time.minute > 0) {
      this.props.onChange({
        hour: 0,
        minute: time.minute
      });
    } else {
      this.props.onChange({
        hour: time.hour,
        minute: time.minute
      });
    }
  };

  render() {
    const { time } = this.props;

    return (
      <div className={styles.timeField}>
        <input
          className={styles.timeInput}
          name="hour"
          value={pad(time.hour)}
          onChange={e => this.handleChange({ ...this.props.time, hour: Number(e.target.value) })}
        />
        <span>:</span>
        <input
          className={styles.timeInput}
          name="minute"
          value={pad(time.minute)}
          onChange={e => this.handleChange({ ...this.props.time, minute: Number(e.target.value) })}
        />
      </div>
    );
  }
}

export class TimePicker extends Component {
  static propTypes = {
    required: PropTypes.bool,
    onChange: PropTypes.func,
    helpText: PropTypes.string,
    labelText: PropTypes.string,
    validationMessage: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    timeFormat: PropTypes.string
  };

  static defaultProps = {
    onChange: () => {},
    name: 'cf-ui-datepicker',
    id: 'cf-ui-datepicker',
    labelText: 'Time',
    timeFormat: getTimeFormatByLocale()
  };

  state = {
    hour: Number(
      moment()
        .add(0.5, 'hours')
        .local()
        .format(getTimeFormatByLocale())
    ),
    minute: Number(
      moment()
        .add(0.5, 'hours')
        .local()
        .format('mm')
    ),
    daytime: moment().format('A')
  };

  handleChange = value => {
    this.setState(
      {
        ...this.state.value,
        ...value
      },
      () => {
        this.props.onChange(this.state);
      }
    );
  };

  render() {
    const { labelText, required, helpText, validationMessage } = this.props;
    return (
      <div className={styles.timePicker}>
        <FormLabel required={required} htmlFor={'scheduleTimeForm'}>
          {labelText}
        </FormLabel>
        <div className={styles.inputWrapper} id="scheduleTimeForm">
          <TimeField
            onChange={this.handleChange}
            time={this.state}
            timeFormat={this.props.timeFormat}
          />
          {this.props.timeFormat === AMPM && (
            <Select
              className={styles.daytimeSelect}
              name="daytime"
              value={this.state.daytime}
              onChange={e => this.handleChange({ daytime: e.target.value })}>
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
}

export default TimePicker;
