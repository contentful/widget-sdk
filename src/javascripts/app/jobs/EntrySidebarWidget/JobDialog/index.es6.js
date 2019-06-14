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
  Note
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
    utcOffset: moment().utcOffset()
  };

  getScheduledAtDate = () => {
    return moment(`${this.state.date} ${this.state.time}`, 'YYYY-MM-DD HH:mm A')
      .utcOffset(this.state.utcOffset)
      .toISOString(true);
  };

  renderTimezoneNote = () => {
    const { date, time, utcOffset } = this.state;
    const localOffset = moment().utcOffset();
    const localTimezoneName = moment.tz.guess();
    return (
      <Note className="f36-margin-top--s" snoteType="primary" title={'Timezone changed'}>
        The scheduled time you have selected will be:{' '}
        {moment
          .utc(date + ' ' + time)
          .zone(utcOffset + localOffset * -1)
          .format('ddd, MMM Do, YYYY - hh:mm A')}
        <br />
        in your local time. ({moment.tz.zone(localTimezoneName).abbr(localOffset)}
        {moment().format('Z')} {localTimezoneName})
      </Note>
    );
  };

  render() {
    const { time, utcOffset } = this.state;
    const { onCreate, onCancel } = this.props;
    return (
      <Modal
        title="Schedule to publish"
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
                    labelText="Publish on"
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
                <FieldGroup>
                  {utcOffset !== moment().utcOffset() && this.renderTimezoneNote()}
                </FieldGroup>
              </Form>
            </Modal.Content>
            <Modal.Controls>
              <Button
                data-test-id="schedule-publication"
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
