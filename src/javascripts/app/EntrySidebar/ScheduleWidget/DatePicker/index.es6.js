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
    minDate: PropTypes.instanceOf(Date),
    maxDate: PropTypes.instanceOf(Date),
    onChange: PropTypes.func,
    helpText: PropTypes.string,
    labelText: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string
  };

  static defaultProps = {
    onChange: () => {},
    name: 'cf-ui-datepicker',
    id: 'cf-ui-datepicker'
  };

  state = {
    value: moment()
  };

  componentDidMount() {
    this.pikaday = new Pikaday({
      field: this.datePickerNode,
      minDate: this.props.minDate,
      maxDate: this.props.maxDate,
      yearRange: 5,
      theme: cn(styles.datePicker, 'hide-carret'),
      onSelect: value => {
        this.setState({ value: moment(value) }, () => {
          this.props.onChange(value);
        });
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

  handleBlur = e => {
    if (!this.state.value.isValid()) {
      this.setState({
        validationError: 'Date is invalid'
      });
    }
    const target = e.relatedTarget || document.activeElement;
    if (this.pikaday && !document.querySelector('.pika-single').contains(target)) {
      this.pikaday.hide();
    }
  };

  render() {
    const { labelText, required, name, helpText, id } = this.props;
    return (
      <div
        className={styles.datePickerWrapper}
        ref={ref => {
          if (ref) {
            this.datePickerNode = ref;
          }
        }}>
        <TextField
          labelText={labelText}
          helpText={helpText}
          required={required}
          name={name}
          textInputProps={{
            readOnly: true
          }}
          value={moment(this.state.value).format('ddd, MMM Do, YYYY')}
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
