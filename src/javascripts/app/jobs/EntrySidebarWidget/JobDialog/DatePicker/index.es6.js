import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Pikaday from 'pikaday';
import moment from 'moment';
import cn from 'classnames';
import { TextField } from '@contentful/forma-36-react-components';
import styles from './styles.es6';

export class DatePicker extends Component {
  static propTypes = {
    required: PropTypes.bool,
    value: PropTypes.instanceOf(Date),
    minDate: PropTypes.instanceOf(Date),
    maxDate: PropTypes.instanceOf(Date),
    onChange: PropTypes.func,
    helpText: PropTypes.string,
    labelText: PropTypes.string.isRequired,
    id: PropTypes.string,
    name: PropTypes.string
  };

  static defaultProps = {
    onChange: () => {},
    name: 'cf-ui-datepicker',
    id: 'cf-ui-datepicker'
  };

  state = {
    validationError: null
  };
  componentDidMount() {
    this.pikaday = new Pikaday({
      field: this.datePickerNode,
      minDate: this.props.minDate,
      maxDate: this.props.maxDate,
      yearRange: 5,
      theme: cn(styles.datePicker, 'hide-carret'),
      onSelect: value => {
        this.props.onChange(value);
      }
    });
  }

  componentWillUnmount() {
    if (this.pikaday) {
      this.pikaday.destroy();
    }
  }

  handleOpen = () => {
    if (this.pikaday) {
      this.pikaday.show();
    }
  };

  handleBlur = () => {
    if (this.pikaday) {
      this.pikaday.hide();
    }
  };

  render() {
    const { labelText, required, name, helpText, id } = this.props;
    return (
      <div className={styles.datePickerWrapper}>
        <TextField
          labelText={labelText}
          helpText={helpText}
          required={required}
          name={name}
          textInputProps={{
            testId: 'date-input',
            readOnly: true,
            inputRef: ref => {
              if (ref) {
                this.datePickerNode = ref;
              }
            }
          }}
          value={moment(this.props.value).format('ddd, MMM Do, YYYY')}
          validationMessage={this.state.validationError}
          id={id}
          onFocus={this.handleOpen}
          onBlur={this.handleBlur}
        />
      </div>
    );
  }
}

export default DatePicker;
