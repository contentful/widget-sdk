import React, { useState, useEffect, useCallback } from 'react';
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
import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient';

import { createDialogClose, createDialogOpen } from 'app/jobs/Analytics/JobsAnalytics';

import JobsTimeline from '../JobsTimeline';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import JobAction, { actionToLabelText } from 'app/jobs/JobAction';
import TimezonePicker from './TimezonePicker';

const styles = {
  timezoneNote: css({
    marginTop: tokens.spacingS
  }),
  form: css({
    marginBottom: `-${tokens.spacingM}`
  })
};

function TimezoneNote({ date, time, timezone }) {
  const localTimezoneName = moment.tz.guess();

  return (
    <Note
      testId="timezone-note"
      className={styles.timezoneNote}
      noteType="primary"
      title="Timezone changed">
      The scheduled time you have selected will be:{' '}
      {moment(formatScheduledAtDate({ date, time, timezone })).format(
        'ddd, MMM Do, YYYY - hh:mm A'
      )}
      <br />
      in your local time. ({localTimezoneName})
    </Note>
  );
}

TimezoneNote.propTypes = {
  date: PropTypes.string,
  time: PropTypes.string,
  timezone: PropTypes.string
};

function formatScheduledAtDate({ date, time, timezone }) {
  const scheduledDate = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
  const scheduledOffset = moment.tz(scheduledDate, timezone).utcOffset();
  return scheduledDate.utcOffset(scheduledOffset, true).toISOString(true);
}

function JobDialog({
  onCreate,
  onCancel,
  isSubmitting,
  entity,
  validator,
  entryTitle,
  spaceId,
  environmentId,
  pendingJobs,
  isMasterEnvironment
}) {
  const now = moment(Date.now());
  const currentTimezone = moment.tz.guess();
  const suggestedDate = getSuggestedDate(pendingJobs, now);
  const [date, setDate] = useState(suggestedDate.format('YYYY-MM-DD'));
  const [time, setTime] = useState(suggestedDate.format('HH:mm'));
  const [action, setAction] = useState(JobAction.Publish);
  const [isSubmitDisabled, setSubmitDisabled] = useState(isSubmitting);
  const [formError, setFormError] = useState('');
  const [timezone, setTimezone] = useState(currentTimezone);

  useEffect(() => {
    createDialogOpen();
    return createDialogClose;
  }, []);

  const validateForm = useCallback(
    onFormValid => {
      if (
        pendingJobs &&
        pendingJobs.length > 0 &&
        pendingJobs.find(
          job =>
            job.scheduledAt ===
            moment(formatScheduledAtDate({ date, time, timezone })).toISOString()
        )
      ) {
        setFormError(
          'There is already an action scheduled for the selected time, please review the current schedule.'
        );
        setSubmitDisabled(false);
        return;
      } else {
        setFormError(null);
      }

      if (moment(formatScheduledAtDate({ date, time, timezone })).isAfter(moment.now())) {
        setFormError(null);
        if (onFormValid) {
          onFormValid();
        }
      } else {
        setFormError("The selected time can't be in the past");
      }

      setSubmitDisabled(false);
    },
    [time, timezone, date, pendingJobs]
  );

  const endpoint = EndpointFactory.createSpaceEndpoint(spaceId, environmentId);
  const client = new APIClient(endpoint);

  function getSuggestedDate() {
    return pendingJobs && pendingJobs.length !== 0
      ? moment(pendingJobs[0].scheduledAt)
          .add(1, 'hours')
          .startOf('hour')
      : now.add(1, 'hours').startOf('hour');
  }

  function handleSubmit() {
    setSubmitDisabled(true);
    validateForm(async () => {
      if (action === JobAction.Publish) {
        try {
          await client.validateEntry(entity);
        } catch (e) {
          validator.setApiResponseErrors(e);
          Notification.error(
            `Error scheduling ${entryTitle}: Validation failed. Please check the individual fields for errors.`
          );
          return;
        }
      }
      onCreate(
        {
          scheduledAt: formatScheduledAtDate({ date, time, timezone }),
          action
        },
        timezone
      );
    });
  }

  return (
    <Modal
      title="Set Schedule"
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
            {pendingJobs && pendingJobs.length > 0 && (
              <JobsTimeline
                size="small"
                jobs={pendingJobs}
                isMasterEnvironment={isMasterEnvironment}
                showAllScheduleLink={false}
                isReadOnly
              />
            )}
            <Form spacing="condensed" className={styles.form}>
              <FieldGroup row>
                <SelectField
                  labelText="Action"
                  onChange={e => setAction(e.target.value)}
                  name="action"
                  id="action">
                  <Option value={JobAction.Publish}>Publish</Option>
                  <Option value={JobAction.Unpublish}>Unpublish</Option>
                </SelectField>
              </FieldGroup>
              <FieldGroup row>
                <DatePicker
                  onChange={date => {
                    setDate(moment(date).format('YYYY-MM-DD'));
                  }}
                  labelText={actionToLabelText(action)}
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
                <TimezonePicker onSelect={value => setTimezone(value)} />
              </FieldGroup>
              {timezone !== currentTimezone && (
                <FieldGroup>
                  <TimezoneNote date={date} time={time} timezone={timezone} />
                </FieldGroup>
              )}
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
              disabled={isSubmitDisabled}
              onClick={handleSubmit}>
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
  isSubmitting: PropTypes.bool.isRequired,
  pendingJobs: PropTypes.array,
  isMasterEnvironment: PropTypes.bool
};

export default JobDialog;
