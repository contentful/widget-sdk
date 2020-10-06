import {
  Button,
  FormLabel,
  Note,
  Notification,
  Paragraph,
  SkeletonBodyText,
  SkeletonContainer,
  Switch,
  TextField,
  TextLink,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { getAppDefinitionLoader } from 'features/apps-core';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { HTTPS_REG_EXP, LEARN_MORE_URL } from '../constants';
import { ManagementApiClient } from '../ManagementApiClient';
import { DisableAppEventsModal } from './DisableAppEventsModal';
import { transformMapToTopics, transformTopicsToMap } from './TopicEventMap';
import { TopicEventTable } from './TopicEventTable';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'new-app',
  campaign: 'in-app-help',
});

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

export function AppEvents({ definition }) {
  const appDefinitionId = definition.sys.id;
  const orgId = definition.sys.organization.sys.id;
  const [topicValues, setTopicValues] = useState(transformTopicsToMap([]));
  const [targetUrl, setTargetUrl] = useState('');
  const [errors, setErrors] = useState([]);
  const [hasEventSubscription, setHasEventSubscription] = useState(false);
  const [isModalShown, setIsModalShown] = useState(false);
  const [appEventToggle, setAppEventToggle] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateAppEvents = async () => {
    if (!HTTPS_REG_EXP.test(targetUrl)) {
      setErrors([
        {
          details: 'Please enter a valid URL',
          path: ['targetUrl'],
        },
      ]);
      return;
    }
    setIsUpdating(true);
    try {
      await ManagementApiClient.updateAppEvents(orgId, appDefinitionId, {
        targetUrl,
        topics: transformMapToTopics(topicValues),
      });
      Notification.success('App Events successfully updated.');
      setHasEventSubscription(true);
    } catch (err) {
      if (err.status === 422) {
        setErrors(err.data.details.errors);
      }

      Notification.error('Failed to update app events.');
    }
    setIsUpdating(false);
  };

  const deleteAppEventSubscription = async () => {
    try {
      await ManagementApiClient.deleteAppEvents(orgId, appDefinitionId);

      setTargetUrl('');
      setTopicValues(transformTopicsToMap([]));

      Notification.success('App event subscription successfully deleted.');
    } catch {
      Notification.error('Failed to delete app event subscription.');
    }
    setAppEventToggle(false);
    setIsModalShown(false);
    setHasEventSubscription(false);
  };

  useEffect(() => {
    let unmounted = false;
    (async () => {
      if (!unmounted) {
        setIsLoading(true);
        try {
          const events = await getAppDefinitionLoader(orgId).getAppEvents(appDefinitionId);
          const { targetUrl, topics } = events;
          setTargetUrl(targetUrl);
          setTopicValues(transformTopicsToMap(topics));
          setAppEventToggle(true);
          setHasEventSubscription(true);
        } catch {
          // no app event subscription was found
          setTopicValues(transformTopicsToMap([]));
        }
        setIsLoading(false);
      }
    })();
    return () => {
      unmounted = true;
    };
  }, [orgId, appDefinitionId]);

  const clearErrorForField = (path) => {
    setErrors((errors) => errors.filter((error) => !isEqual(error.path, path)));
  };

  return (
    <div>
      <Note className={styles.spacer}>
        You need a private key to sign access token requests. We only store public keys.
        <br />
        <TextLink
          href={withInAppHelpUtmParams(LEARN_MORE_URL)}
          target="_blank"
          rel="noopener noreferrer">
          Learn how to sign your access tokens
        </TextLink>
      </Note>
      {isLoading ? (
        <SkeletonContainer>
          <SkeletonBodyText numberOfLines={5} />
        </SkeletonContainer>
      ) : (
        <React.Fragment>
          <Switch
            id="appEvent"
            labelText="Enable events"
            className={styles.spacer}
            isChecked={appEventToggle}
            onToggle={() => {
              if (appEventToggle && hasEventSubscription) {
                setIsModalShown(true);
              } else {
                setAppEventToggle(!appEventToggle);
              }
            }}
          />
          {appEventToggle ? (
            <div>
              <TextField
                id="targetUrl"
                className={styles.spacer}
                required={true}
                value={targetUrl}
                textInputProps={{
                  disabled: isLoading,
                  placeholder: 'https://',
                }}
                validationMessage={
                  errors.find((error) => isEqual(error.path, ['targetUrl']))?.details
                }
                onChange={(event) => {
                  clearErrorForField(['targetUrl']);
                  setTargetUrl(event.target.value.trim());
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
                onChange={(map) => setTopicValues(map)}
              />
              <Button
                disabled={transformMapToTopics(topicValues).length === 0}
                buttonType="positive"
                loading={isUpdating}
                className={styles.spacerButton}
                onClick={updateAppEvents}>
                Save events
              </Button>
            </div>
          ) : null}
          <DisableAppEventsModal
            onDisableAppEvents={deleteAppEventSubscription}
            isShown={isModalShown}
            title={`Disable events for ${definition.name}`}
            onClose={() => setIsModalShown(false)}
          />
        </React.Fragment>
      )}
    </div>
  );
}

AppEvents.propTypes = {
  definition: PropTypes.object.isRequired,
};
