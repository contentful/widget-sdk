import {
  FormLabel,
  Note,
  Paragraph,
  Switch,
  TextField,
  TextLink,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { LEARN_MORE_URL } from '../DocumentationUrls';
import { DisableAppEventsModal } from './DisableAppEventsModal';
import { transformMapToTopics, transformTopicsToMap } from './TopicEventMap';
import { TopicEventTable } from './TopicEventTable';
import { AppDetailsStateContext } from '../AppDetails/AppDetailsStateContext';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'new-app',
  campaign: 'in-app-help',
});

export function validate(events, errorPath) {
  const errors = [];

  if (events.enabled && !events.targetUrl.startsWith('https://')) {
    errors.push({
      details: 'Please enter a valid URL',
      path: [...errorPath, 'targetUrl'],
    });
  }

  return errors;
}

const styles = {
  spacer: css({
    marginBottom: tokens.spacingL,
  }),
  spacerButton: css({
    marginTop: tokens.spacingXl,
  }),
  topicsHelp: css({
    marginBottom: tokens.spacingL,
    color: tokens.colorTextLight,
  }),
};

export function AppEvents({ errorPath, errors, savedEvents, onErrorsChange, disabled }) {
  const { draftDefinition, draftEvents, setDraftEvents } = React.useContext(AppDetailsStateContext);
  const topicValues = useMemo(() => transformTopicsToMap(draftEvents.topics), [draftEvents]);

  const [isAppEventsModalShown, setIsAppEventsModalShown] = useState(false);

  const clearErrorForField = (path) => {
    onErrorsChange(errors.filter((error) => !isEqual(error.path, path)));
  };

  return (
    <div>
      <Note className={styles.spacer}>
        Use app events to be notified about changes in the environments your app is installed in.
        <br />
        <TextLink
          href={withInAppHelpUtmParams(LEARN_MORE_URL)}
          target="_blank"
          rel="noopener noreferrer">
          Learn more about app identities and events
        </TextLink>
      </Note>

      <Switch
        id="appEvent"
        labelText="Enable events"
        className={styles.spacer}
        isChecked={draftEvents.enabled}
        onToggle={() => {
          if (draftEvents.enabled) {
            if (savedEvents.enabled) {
              setIsAppEventsModalShown(true);
            } else {
              setDraftEvents({
                ...draftEvents,
                enabled: false,
              });
            }
          } else {
            setDraftEvents({
              ...draftEvents,
              enabled: true,
            });
          }
        }}
      />
      {draftEvents.enabled && (
        <>
          <TextField
            id="targetUrl"
            className={styles.spacer}
            required={true}
            value={draftEvents.targetUrl}
            textInputProps={{
              placeholder: 'https://',
              disabled,
            }}
            validationMessage={
              errors.find((error) => isEqual(error.path, [...errorPath, 'targetUrl']))?.details
            }
            onChange={(event) => {
              clearErrorForField([...errorPath, 'targetUrl']);
              setDraftEvents({
                ...draftEvents,
                targetUrl: event.target.value.trim(),
              });
            }}
            name="url"
            labelText="URL"
            helpText="Events will send POST requests to this URL. URLs must be public and use HTTPS."
          />
          <FormLabel htmlFor="appEventTopics">Topics</FormLabel>
          <Paragraph className={styles.topicsHelp}>
            Select which topics your app subscribes to.
          </Paragraph>
          <TopicEventTable
            id="appEventTopics"
            values={topicValues}
            onChange={(map) => {
              setDraftEvents({
                ...draftEvents,
                topics: transformMapToTopics(map),
              });
            }}
            disabled={disabled}
          />
        </>
      )}
      <DisableAppEventsModal
        onDisableAppEvents={() => {
          setDraftEvents({
            ...draftEvents,
            enabled: false,
          });
          setIsAppEventsModalShown(false);
        }}
        isShown={isAppEventsModalShown}
        title={`Disable events for ${draftDefinition.name}`}
        onClose={() => setIsAppEventsModalShown(false)}
      />
    </div>
  );
}

AppEvents.propTypes = {
  savedEvents: PropTypes.object.isRequired,
  errorPath: PropTypes.array.isRequired,
  errors: PropTypes.array.isRequired,
  onErrorsChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};
