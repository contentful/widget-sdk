import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import {
  Button,
  Modal,
  FieldGroup,
  Form,
  SelectField,
  Option,
  TextLink
} from '@contentful/forma-36-react-components';
import { createTimezonesByOffset } from './Utils.es6';
import DatePicker from '../DatePicker/index.es6';
import TimePicker from '../TimePicker/index.es6';

const createTimezoneOptions = () => {
  const timezonesByOffset = createTimezonesByOffset();
  return Object.keys(timezonesByOffset).map(offset => {
    const i18n = timezonesByOffset[offset].i18nTimezones.join(', ');
    const timezone = moment.tz(timezonesByOffset[offset].name).format('Z');
    return <Option key={timezone} value={offset}>{`(GMT${timezone}) ${i18n}`}</Option>;
  });
};

class JobDialog extends React.Component {
  static propTypes = {
    onCreate: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  state = {
    date: moment().format('YYYY-MM-DD'),
    time: moment().format('HH:mm'),
    utcOffset: moment().utcOffset(),
    timeZoneVisible: false
  };

  getScheduledAtDate = () => {
    return moment(`${this.state.date} ${this.state.time}`, 'YYYY-MM-DD HH:mm A')
      .utcOffset(this.state.utcOffset)
      .toDate();
  };

  render() {
    const { time, utcOffset } = this.state;
    const { onCreate, onCancel } = this.props;
    return (
      <Modal
        title="Schedule Publication"
        size="small"
        shouldCloseOnEscapePress
        shouldCloseOnOverlayClick
        isShown
        testId="schedule-publication-modal"
        onClose={() => onCancel(false)}>
        {({ title, onClose }) => (
          <React.Fragment>
            <Modal.Header title={title} onClose={onClose} />
            <Modal.Content>
              <Form spacing="condensed">
                <FieldGroup row>
                  <DatePicker
                    onChange={date => {
                      this.setState({ date: moment(date).format('YYYY-MM-DD') });
                    }}
                    labelText="Date"
                    required
                    minDate={moment().toDate()}
                  />
                  <TimePicker
                    name="time"
                    value={time}
                    onChange={time => {
                      this.setState({
                        time: `${time.hour}:${time.minute} ${time.daytime}`
                      });
                    }}
                    required
                    id="time"
                    labelText="Time"
                  />
                </FieldGroup>

                {!this.state.timeZoneVisible && (
                  <TextLink
                    onClick={() => {
                      this.setState({ timeZoneVisible: true });
                    }}
                    icon="Plus">
                    Add Timezone
                  </TextLink>
                )}

                {this.state.timeZoneVisible && (
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
                      value={utcOffset.toString()}>
                      {createTimezoneOptions()}
                    </SelectField>
                  </FieldGroup>
                )}
              </Form>
            </Modal.Content>
            <Modal.Controls>
              <Button
                type="submit"
                onClick={() => {
                  onCreate({
                    scheduledAt: this.getScheduledAtDate()
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

export default JobDialog;
