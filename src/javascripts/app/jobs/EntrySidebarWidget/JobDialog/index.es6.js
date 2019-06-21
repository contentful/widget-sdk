import React, { useState } from 'react';
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

import { getTimezoneOptions } from './Timezones.es6';

import DatePicker from './DatePicker/index.es6';
import TimePicker from './TimePicker/index.es6';

function TimezoneNote({ date, time, utcOffset }) {
  const localOffset = moment().utcOffset();
  const localTimezoneName = moment.tz.guess();

  return (
    <Note
      testId="timezone-note"
      className="f36-margin-top--s"
      noteType="primary"
      title="Timezone changed">
      The scheduled time you have selected will be:{' '}
      {moment(formatScheduledAtDate({ date, time, utcOffset })).format(
        'ddd, MMM Do, YYYY - hh:mm A'
      )}
      <br />
      in your local time. ({moment.tz.zone(localTimezoneName).abbr(localOffset)}
      {moment().format('Z')} {localTimezoneName})
    </Note>
  );
}

TimezoneNote.propTypes = {
  date: PropTypes.string,
  time: PropTypes.string,
  utcOffset: PropTypes.number
};

function formatScheduledAtDate({ date, time, utcOffset }) {
  const res = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm A')
    .utcOffset(utcOffset, true)
    .toISOString(true);

  return res;
}

function JobDialog({ onCreate, onCancel }) {
  const now = moment(Date.now());
  const suggestedDate = now.add(0.5, 'hours');

  const [date, setDate] = useState(suggestedDate.format('YYYY-MM-DD'));
  const [time, setTime] = useState(suggestedDate.format('HH:mm'));
  const [utcOffset, setUtcOffset] = useState(suggestedDate.utcOffset());

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
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Form spacing="condensed">
              <FieldGroup row>
                <DatePicker
                  onChange={date => {
                    setDate(moment(date).format('YYYY-MM-DD'));
                  }}
                  labelText="Publish on"
                  required
                  value={moment(date).toDate()}
                  minDate={now.toDate()}
                  data-test-id="date"
                />
                <TimePicker
                  name="time"
                  value={time}
                  onChange={time => {
                    setTime(time);
                  }}
                  required
                  id="time"
                  labelText="Time"
                  data-test-id="time"
                />
              </FieldGroup>
              <FieldGroup row>
                <SelectField
                  name="timezone"
                  id="timezone"
                  testId="timezone"
                  onChange={e => {
                    setUtcOffset(Number(e.target.value));
                  }}
                  labelText="Timezone"
                  value={utcOffset.toString()}>
                  {getTimezoneOptions().map(({ timezone, offset, label }) => (
                    <Option key={timezone} value={offset}>
                      {label}
                    </Option>
                  ))}
                </SelectField>
              </FieldGroup>
              <FieldGroup>
                {utcOffset !== now.utcOffset() && (
                  <TimezoneNote date={date} time={time} utcOffset={utcOffset} />
                )}
              </FieldGroup>
            </Form>
          </Modal.Content>
          <Modal.Controls>
            <Button
              data-test-id="schedule-publication"
              type="submit"
              onClick={() => {
                onCreate({
                  scheduledAt: formatScheduledAtDate({ date, time, utcOffset })
                });
              }}>
              Schedule
            </Button>
            <Button buttonType="muted" data-test-id="cancel" onClick={() => onCancel()}>
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

JobDialog.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default JobDialog;
