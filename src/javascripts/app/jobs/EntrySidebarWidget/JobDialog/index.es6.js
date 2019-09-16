import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Button,
  Modal,
  FieldGroup,
  Form,
  SelectField,
  Option,
  Note,
  Notification
} from '@contentful/forma-36-react-components';
import * as EndpointFactory from 'data/EndpointFactory.es6';
import APIClient from 'data/APIClient.es6';

import { getTimezoneOptions } from './Timezones.es6';
import { createDialogClose, createDialogOpen } from 'app/jobs/Analytics/JobsAnalytics.es6';

import DatePicker from './DatePicker/index.es6';
import TimePicker from './TimePicker/index.es6';

const styles = {
  timezoneNote: css({
    marginTop: tokens.spacingS
  })
};

function TimezoneNote({ date, time, utcOffset }) {
  const localOffset = moment().utcOffset();
  const localTimezoneName = moment.tz.guess();

  return (
    <Note
      testId="timezone-note"
      className={styles.timezoneNote}
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
  const res = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm')
    .utcOffset(utcOffset, true)
    .toISOString(true);

  return res;
}

function usePreviousDate(dateTimeOffset) {
  const ref = useRef();
  useEffect(() => {
    ref.current = dateTimeOffset;
  });
  return ref.current;
}

function JobDialog({
  onCreate,
  onCancel,
  isSubmitting,
  entity,
  validator,
  entryTitle,
  spaceId,
  environmentId
}) {
  const now = moment(Date.now());
  const suggestedDate = now.add(1, 'hours').startOf('hour');

  const [date, setDate] = useState(suggestedDate.format('YYYY-MM-DD'));
  const [time, setTime] = useState(suggestedDate.format('HH:mm'));
  const [formError, setFormError] = useState('');
  const [utcOffset, setUtcOffset] = useState(suggestedDate.utcOffset());
  const prevTimeAndDate = usePreviousDate({ time, date, utcOffset });

  useEffect(() => {
    createDialogOpen();
    return createDialogClose;
  }, []);

  const validateForm = useCallback(
    onFormValid => {
      if (moment(formatScheduledAtDate({ date, time, utcOffset })).isAfter(moment.now())) {
        setFormError(null);
        if (onFormValid) {
          onFormValid();
        }
      } else {
        setFormError("The selected time can't be in the past");
      }
    },
    [time, utcOffset, date]
  );

  useEffect(() => {
    if (!prevTimeAndDate) {
      return;
    }

    if (
      prevTimeAndDate.time !== time ||
      prevTimeAndDate.date !== date ||
      prevTimeAndDate.utcOffset !== utcOffset
    ) {
      validateForm();
    }
  }, [time, date, utcOffset, prevTimeAndDate, validateForm]);

  const endpoint = EndpointFactory.createSpaceEndpoint(spaceId, environmentId);
  const client = new APIClient(endpoint);

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
                  date={date}
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
              {formError && (
                <FieldGroup>
                  <Note noteType="negative" testId="job-dialog-validation-message">
                    {formError}
                  </Note>
                </FieldGroup>
              )}
            </Form>
          </Modal.Content>
          <Modal.Controls>
            <Button
              data-test-id="schedule-publication"
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={() => {
                validateForm(async () => {
                  try {
                    await client.validateEntry(entity);
                  } catch (e) {
                    validator.setApiResponseErrors(e);
                    Notification.error(
                      `Error scheduling ${entryTitle}: Validation failed. Please check the individual fields for errors.`
                    );
                    return;
                  }

                  onCreate({
                    scheduledAt: formatScheduledAtDate({ date, time, utcOffset })
                  });
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
  spaceId: PropTypes.string.isRequired,
  environmentId: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  validator: PropTypes.shape({
    run: PropTypes.func,
    setApiResponseErrors: PropTypes.func
  }).isRequired,
  entryTitle: PropTypes.string.isRequired,
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired
};

export default JobDialog;
