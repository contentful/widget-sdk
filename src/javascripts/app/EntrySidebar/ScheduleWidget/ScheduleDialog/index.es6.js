import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import {
  Button,
  Modal,
  TextField,
  FieldGroup,
  Form,
  SelectField,
  Option
} from '@contentful/forma-36-react-components';
import { createTimezonesByOffset } from './Utils.es6';

const createTimezoneOptions = () => {
  const timezonesByOffset = createTimezonesByOffset();
  return Object.keys(timezonesByOffset).map(offset => {
    const i18n = timezonesByOffset[offset].i18nTimezones.join(', ');
    const timezone = moment.tz(timezonesByOffset[offset].name).format('Z');
    return <Option key={name} value={offset}>{`(GMT${timezone}) ${i18n}`}</Option>;
  });
};

class ScheduleDialog extends React.Component {
  static propTypes = {
    onCreate: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  state = {
    date: moment().format('YYYY-MM-DD'),
    time: moment()
      .add(1, 'h')
      .format('HH:mm'),
    utcOffset: moment().utcOffset()
  };

  getScheduleDate = () => {
    return moment(`${this.state.date} ${this.state.time}`, 'YYYY-MM-DD HH:mm')
      .utcOffset(this.state.utcOffset)
      .toDate();
  };

  render() {
    const { date, time, utcOffset } = this.state;
    const { onCreate, onCancel } = this.props;
    return (
      <Modal
        title="Schedule Publication"
        shouldCloseOnEscapePress
        shouldCloseOnOverlayClick
        isShown
        onClose={() => onCancel(false)}>
        {({ title, onClose }) => (
          <React.Fragment>
            <Modal.Header title={title} onClose={onClose} />
            <Modal.Content>
              <Form spacing="condensed">
                <FieldGroup row>
                  <TextField
                    name="date"
                    id="date"
                    textInputProps={{
                      type: 'date',
                      min: moment().format('YYYY-MM-DD')
                    }}
                    value={date}
                    onChange={e => {
                      this.setState({
                        date: e.target.value
                      });
                    }}
                    required
                    labelText="Date"
                    helpText="Please select a date"
                  />
                  <TextField
                    name="time"
                    textInputProps={{
                      type: 'time'
                    }}
                    value={time}
                    onChange={e => {
                      this.setState({
                        time: e.target.value
                      });
                    }}
                    required
                    id="time"
                    labelText="Time"
                    helpText="Please enter a time"
                  />
                </FieldGroup>
                <FieldGroup row>
                  <SelectField
                    name="timezone"
                    id="timezone"
                    onChange={e => {
                      this.setState({
                        utcOffset: Number(e.target.value)
                      });
                    }}
                    labelText="Timezone"
                    value={utcOffset}
                    helpText="Please select a Timezone">
                    {createTimezoneOptions()}
                  </SelectField>
                </FieldGroup>
              </Form>
            </Modal.Content>
            <Modal.Controls>
              <Button
                type="submit"
                onClick={() => {
                  onCreate({
                    actionType: 'publish',
                    scheduledAt: this.getScheduleDate()
                  });
                }}>
                Schedule
              </Button>
              <Button buttonType="muted" onClick={() => onCancel()}>
                Cancel
              </Button>
            </Modal.Controls>
          </React.Fragment>
        )}
      </Modal>
    );
  }
}

export default ScheduleDialog;
