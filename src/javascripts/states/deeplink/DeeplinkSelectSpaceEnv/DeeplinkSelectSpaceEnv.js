import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  isInstallLink,
  isWebhookLink,
  WebhookLinkHeader,
  AppLinkHeader,
  ExtensionLinkHeader,
  isExtensionLink,
  isAppLink,
} from './ExtensibilityDeeplinks';
import { Heading, Form, SelectField, Option, Button } from '@contentful/forma-36-react-components';
import { useComponentState } from './DeeplinkSelectSpaceEnvState';

const styles = {
  root: css({
    marginTop: tokens.spacing3Xl,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }),
  card: css({
    width: '500px',
    border: `1px solid ${tokens.colorElementMid}`,
    boxShadow: tokens.boxShadowDefault,
  }),
  form: css({
    paddingLeft: tokens.spacingL,
    paddingRight: tokens.spacingL,
  }),
  title: css({
    textAlign: 'center',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
  }),
  buttonsPanel: css({
    display: 'inline',
    marginTop: tokens.spacingL,
  }),
  button: css({
    marginLeft: tokens.spacingS,
    marginRight: tokens.spacingS,
    width: 120,
  }),
};

function getCardTitle({ selectEnvironment, link, id }) {
  if (isInstallLink(link, id)) {
    return 'Choose where to install';
  } else if (selectEnvironment === true) {
    return 'Select space & environment';
  } else {
    return 'Select space';
  }
}

function isUrlSafe(url) {
  return ['http://', 'https://'].some((proto) => url.trim().startsWith(proto));
}

export default function DeeplinkSelectSpaceEnv(props) {
  const { state, fetchInitialData, selectEnvironment, selectSpace } = useComponentState();
  const { link, id, url } = props.searchParams;

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        {id && isWebhookLink(link) && <WebhookLinkHeader templateId={id} />}
        {id && isAppLink(link) && <AppLinkHeader appId={id} apps={props.marketplaceApps} />}
        {url && isExtensionLink(link) && isUrlSafe(url) && <ExtensionLinkHeader url={url} />}
        <Heading className={styles.title}>
          {getCardTitle({
            selectEnvironment: props.selectEnvironment,
            link,
            id: id || url,
          })}
        </Heading>
        <Form className={styles.form}>
          {props.selectSpace === true && (
            <SelectField
              selectProps={{
                isDisabled: state.loading,
                testId: 'deeplink-select-space',
              }}
              labelText="Space"
              required
              id="space"
              name="space"
              value={state.spaceId}
              onChange={(e) => {
                selectSpace(e.target.value);
              }}>
              <Option value="">Select space</Option>
              {state.organizations.map(({ id, name, spaces }) => {
                return (
                  <optgroup key={id} label={name}>
                    {spaces.map((space) => (
                      <Option key={space.sys.id} value={space.sys.id}>
                        {space.name}
                      </Option>
                    ))}
                  </optgroup>
                );
              })}
            </SelectField>
          )}
          {props.selectEnvironment === true && (
            <SelectField
              selectProps={{
                isDisabled: state.loading,
                testId: 'deeplink-select-environment',
              }}
              labelText="Environment"
              required
              id="environment"
              name="environment"
              value={state.environmentId}
              onChange={(e) => {
                selectEnvironment(e.target.value);
              }}>
              <Option value="">Select environment</Option>
              {state.environments.map((env) => (
                <Option key={env.sys.id} value={env.sys.id}>
                  {env.name}
                </Option>
              ))}
            </SelectField>
          )}
        </Form>
      </div>
      <div className={styles.buttonsPanel}>
        <Button
          buttonType="muted"
          className={styles.button}
          onClick={() => {
            props.onCancel();
          }}>
          Cancel
        </Button>
        <Button
          testId="deeplink-proceed"
          disabled={state.spaceId === '' || state.environmentId === ''}
          buttonType="primary"
          className={styles.button}
          onClick={() => {
            props.onContinue({
              spaceId: state.spaceId,
              environmentId: state.environmentId,
            });
          }}>
          Continue
        </Button>
      </div>
    </div>
  );
}

DeeplinkSelectSpaceEnv.propTypes = {
  href: PropTypes.string.isRequired,
  searchParams: PropTypes.object.isRequired,
  marketplaceApps: PropTypes.object.isRequired,
  onContinue: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  selectSpace: PropTypes.bool.isRequired,
  selectEnvironment: PropTypes.bool,
};
