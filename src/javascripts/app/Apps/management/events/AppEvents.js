import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextLink,
  TextField,
  FormLabel,
  Paragraph,
  Button,
  SkeletonContainer,
  SkeletonBodyText,
  Notification,
  Switch,
} from '@contentful/forma-36-react-components';
import * as ManagementApiClient from '../ManagementApiClient';
import tokens from '@contentful/forma-36-tokens';
import { getAppDefinitionLoader } from 'app/Apps/AppDefinitionLoaderInstance';
import { css } from 'emotion';
import { TopicEventTable } from './TopicEventTable';
import { transformMapToTopics, transformTopicsToMap } from './TopicEventMap';
import { DisableAppEventsModal } from './DisableAppEventsModal';

const styles = {
  spacer: css({
    marginBottom: tokens.spacingXl,
  }),
  spacerButton: css({
    marginTop: tokens.spacing2Xl,
  }),
};

const httpsRegExp = /^https:\/\/.+$/;

export function AppEvents({ definition }) {
  const appDefinitionId = definition.sys.id;
  const orgId = definition.sys.organization.sys.id;
  const [topicValues, setTopicValues] = useState(transformTopicsToMap([]));
  const [targetUrl, setTargetUrl] = useState('');
  const [error, setError] = useState('');
  const [hasEventSubscription, setHasEventSubscription] = useState(false);
  const [isModalShown, setIsModalShown] = useState(false);
  const [appEventToggle, setAppEventToggle] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateAppEvents = async () => {
    if (!httpsRegExp.test(targetUrl)) {
      setError('Please enter a valid URL');
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
    } catch {
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

  return (
    <div>
      <Paragraph className={styles.spacer}>
        Your App can subscribe to events happening in its installation environments using webhooks.{' '}
        <TextLink> Learn more about app events.</TextLink>
      </Paragraph>
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
                validationMessage={error}
                onChange={(event) => {
                  setError('');
                  setTargetUrl(event.target.value);
                }}
                name="url"
                labelText="URL"
                helpText="Only HTTPS URLs are supported"
              />
              <FormLabel htmlFor="appEventTopics">Topics</FormLabel>
              <Paragraph className={styles.spacer}>
                Select which topics you want to subscribe to. The selection is based on your apps
                read-access <TextLink>perimssions</TextLink>
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
