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
  Note,
  RadioButtonField,
  FormLabel,
} from '@contentful/forma-36-react-components';

import {
  createDialogClose,
  createDialogOpen,
} from 'app/ScheduledActions/Analytics/ScheduledActionsAnalytics';

import ScheduledActionsTimeline from '../ScheduledActionsTimeline';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import ScheduledAction, { actionToLabelText } from 'app/ScheduledActions/ScheduledActionAction';
import TimezonePicker from './TimezonePicker';
import { formatScheduledAtDate } from './utils';

const styles = {
  timezoneNote: css({
    marginTop: tokens.spacingS,
  }),
  form: css({
    marginBottom: `-${tokens.spacingM}`,
  }),
  noMarginBottom: css({
    marginBottom: 0,
  }),
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
        'ddd, DD MMM YYYY [at] h:mm A'
      )}
      <br />
      in your local time. ({localTimezoneName})
    </Note>
  );
}

TimezoneNote.propTypes = {
  date: PropTypes.string,
  time: PropTypes.string,
  timezone: PropTypes.string,
};

function ScheduledActionModalDialog({
  showUnpublish,
  handleSubmit,
  onCancel,
  isSubmitting,
  mostRecentlyScheduledAction,
  pendingJobs,
  isMasterEnvironment,
  linkType,
}) {
  const now = moment(Date.now());
  const currentTimezone = moment.tz.guess();
  const suggestedDate = getSuggestedDate();
  const [date, setDate] = useState(suggestedDate.format('YYYY-MM-DD'));
  const [time, setTime] = useState(suggestedDate.format('HH:mm'));
  const [action, setAction] = useState(ScheduledAction.Publish);
  const [timezone, setTimezone] = useState(currentTimezone);
  const [isSubmitDisabled, setSubmitDisabled] = useState(isSubmitting);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    createDialogOpen();
    return createDialogClose;
  }, []);

  const validateForm = useCallback(
    (onFormValid) => {
      if (
        pendingJobs &&
        pendingJobs.length > 0 &&
        pendingJobs.find(
          (job) =>
            job.scheduledFor.datetime ===
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

  function getSuggestedDate() {
    if (mostRecentlyScheduledAction) {
      return moment(mostRecentlyScheduledAction.scheduledFor.datetime)
        .add(1, 'hours')
        .startOf('hour');
    }
    // TODO: Refactor it.
    // it expects pendingJobs by default in DESC sorting, so the first job is scheduled the farthest in future
    // then when new jobs are created, it expects them to be appended to the array, so the first job is expected to be THE MOST RECENTLY SCHEDULED ONE
    return pendingJobs?.length
      ? moment(pendingJobs[0].scheduledFor.datetime).add(1, 'hours').startOf('hour')
      : now.add(1, 'hours').startOf('hour');
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
              <ScheduledActionsTimeline
                size="small"
                jobs={pendingJobs}
                isMasterEnvironment={isMasterEnvironment}
                showAllScheduleLink={false}
                linkType={linkType}
                isReadOnly
              />
            )}
            <Form spacing="condensed" className={styles.form}>
              <FormLabel className={styles.noMarginBottom} htmlFor="actions">
                Action
              </FormLabel>
              <FieldGroup row>
                <RadioButtonField
                  id="action-publish"
                  labelText="Publish"
                  onClick={() => setAction(ScheduledAction.Publish)}
                  checked={action === ScheduledAction.Publish}
                  labelIsLight={action !== ScheduledAction.Publish}
                />
                {showUnpublish ? (
                  <RadioButtonField
                    id="action-unpublish"
                    labelText="Unpublish"
                    onClick={() => setAction(ScheduledAction.Unpublish)}
                    checked={action === ScheduledAction.Unpublish}
                    labelIsLight={action !== ScheduledAction.Unpublish}
                  />
                ) : null}
              </FieldGroup>
              <FieldGroup row>
                <DatePicker
                  onChange={(date) => {
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
                  onChange={(time) => {
                    setTime(time);
                  }}
                  required
                  id="time"
                  labelText="Time"
                  data-test-id="time"
                />
              </FieldGroup>
              <FieldGroup row>
                <TimezonePicker onSelect={(value) => setTimezone(value)} />
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
              onClick={() => {
                setSubmitDisabled(true);
                handleSubmit({ validateForm, action, date, time, timezone });
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

ScheduledActionModalDialog.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  pendingJobs: PropTypes.array,
  mostRecentlyScheduledAction: PropTypes.object,
  showUnpublish: PropTypes.bool,
  isMasterEnvironment: PropTypes.bool,
  linkType: PropTypes.string.isRequired,
};

export default ScheduledActionModalDialog;
