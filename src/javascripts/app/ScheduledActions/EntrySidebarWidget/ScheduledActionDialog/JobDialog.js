import React, { useState, useEffect } from 'react';
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
  createDialogClose as trackDialogClose,
  createDialogOpen as trackDialogOpen,
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

function JobDialog({
  showUnpublish,
  handleSubmit,
  onCancel,
  isSubmitting,
  pendingJobs,
  isMasterEnvironment,
  validationError,
  linkType,
}) {
  const now = moment(Date.now());
  const currentTimezone = moment.tz.guess();
  const suggestedDate = getSuggestedDate(pendingJobs, now);
  const [date, setDate] = useState(suggestedDate.format('YYYY-MM-DD'));
  const [time, setTime] = useState(suggestedDate.format('HH:mm'));
  const [action, setAction] = useState(ScheduledAction.Publish);
  const [timezone, setTimezone] = useState(currentTimezone);

  useEffect(() => {
    trackDialogOpen();
  }, []);

  function getSuggestedDate() {
    return pendingJobs && pendingJobs.length !== 0
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
      onClose={() => {
        trackDialogClose(false);
        return onCancel(false);
      }}>
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
              {validationError && (
                <FieldGroup>
                  <Note noteType="negative" testId="job-dialog-validation-message">
                    {validationError}
                  </Note>
                </FieldGroup>
              )}
            </Form>
          </Modal.Content>
          <Modal.Controls>
            <Button
              testId="schedule-publication"
              type="submit"
              loading={isSubmitting}
              disabled={Boolean(isSubmitting || validationError)}
              onClick={() => {
                handleSubmit({ action, date, time, timezone });
                trackDialogClose(true);
              }}>
              Schedule
            </Button>
            <Button buttonType="muted" testId="cancel" onClick={onClose}>
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

JobDialog.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  pendingJobs: PropTypes.array,
  showUnpublish: PropTypes.bool,
  isMasterEnvironment: PropTypes.bool,
  linkType: PropTypes.string.isRequired,
  validationError: PropTypes.string,
};

export default JobDialog;
