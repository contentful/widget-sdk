import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  List,
  ListItem,
  SkeletonContainer,
  SkeletonBodyText,
  Subheading,
  Typography,
  Paragraph,
  Button,
  Notification
} from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import ApiKeysWorkbench from '../ApiKeysWorkbench';
import ApiKeysNavigation from '../ApiKeysNavigation';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';
import ApiKeyList from './ApiKeyList';
import { getSubscriptionState } from 'account/AccountUtils.es6';
import { useApiKeysState } from './ApiKeyListState';
import * as Navigator from 'states/Navigator.es6';

const styles = {
  emptyStateRoot: css({
    marginTop: '100px',
    maxHeight: '246px',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }),
  emptyStateFrame: css({
    textAlign: 'center',
    minWidth: '500px',
    margin: '0 auto',
    padding: tokens.spacingL,
    backgroundColor: tokens.colorElementLightest,
    border: `1px solid ${tokens.colorElementMid}`
  })
};

function EmptyStateAdvice() {
  return (
    <div className={styles.emptyStateRoot}>
      <div className={styles.emptyStateFrame}>
        <Typography>
          <Subheading element="h1">{"You don't have any API keys yet"}</Subheading>
        </Typography>
        <Paragraph>Create your first API key to get started delivering content.</Paragraph>
      </div>
    </div>
  );
}

function StaffHint() {
  return (
    <WorkbenchSidebarItem title="A hint from our staff">
      <div className="staff-hint">
        <i className="fa fa-quote-left"></i>
        <div className="staff-hint__quote">
          <div className="staff-hint__content">
            Create separate API keys if you have multiple platforms you need to deliver content to.
          </div>
          <div className="staff-hint__author">
            <div className="staff-hint__author-photo x--herve"></div>
            <div className="staff-hint__author-name">
              <strong>Herve Labas</strong>
              <p>Product Manager at Contentful</p>
            </div>
          </div>
        </div>
      </div>
    </WorkbenchSidebarItem>
  );
}

function Documentation() {
  return (
    <WorkbenchSidebarItem title="Documentation">
      <List>
        <ListItem>
          Learn more about the{' '}
          <KnowledgeBase target="content_apis" text="four content APIs" inlineText />.
        </ListItem>
        <ListItem>
          Read the{' '}
          <KnowledgeBase
            target="delivery_api"
            text="reference docs for the content delivery API"
            inlineText
          />
          .
        </ListItem>
      </List>
    </WorkbenchSidebarItem>
  );
}

function UsageInformation(props) {
  if (props.reachedLimit) {
    const subscriptionState = getSubscriptionState();
    return (
      <>
        <Paragraph>
          Your space is using {props.usedAPIKeys} out of {props.limits.maximum} API keys.
        </Paragraph>
        {subscriptionState ? (
          <Paragraph>
            If you want to create additional keys, you need to either delete an existing one or{' '}
            <StateLink to={subscriptionState.path.join('.')} params={subscriptionState.params}>
              upgrade your account
            </StateLink>
            .
          </Paragraph>
        ) : (
          <Paragraph>
            If you want to create additional keys, you need to either delete an existing one or
            contact the owner of your organization to upgrade the account.
          </Paragraph>
        )}
      </>
    );
  }
  return props.isLegacyOrganization ? (
    <Paragraph>
      Your space is using {props.usedAPIKeys} out of {props.limits.maximum} API Keys.
    </Paragraph>
  ) : (
    <Paragraph>
      Your space is using {props.usedAPIKeys} API {props.usedAPIKeys > 1 ? 'keys' : 'key'}.
    </Paragraph>
  );
}

UsageInformation.propTypes = {
  isLegacyOrganization: PropTypes.bool,
  reachedLimit: PropTypes.bool,
  limits: PropTypes.shape({
    maximum: PropTypes.number
  }),
  usedAPIKeys: PropTypes.number.isRequired
};

function AddApiKeys(props) {
  const [creating, setCreating] = useState(false);

  const onCreateClick = () => {
    setCreating(true);
    props
      .createAPIKey()
      .then(apiKey => {
        Navigator.go({ path: '^.detail', params: { apiKeyId: apiKey.sys.id } });
      })
      .catch(err => {
        Notification.error(err.data.message);
      })
      .finally(() => {
        setCreating(false);
      });
  };

  return (
    <WorkbenchSidebarItem title="Add API keys">
      <Typography>
        {props.loaded && props.usedAPIKeys > 0 && <UsageInformation {...props} />}
      </Typography>
      <Button
        testId="add-api-key"
        loading={!props.loaded || creating}
        disabled={props.reachedLimit}
        buttonType="primary"
        isFullWidth
        icon="PlusCircle"
        onClick={onCreateClick}>
        Add API key
      </Button>
    </WorkbenchSidebarItem>
  );
}

AddApiKeys.propTypes = {
  usedAPIKeys: PropTypes.number.isRequired,
  reachedLimit: PropTypes.bool,
  loaded: PropTypes.bool.isRequired,
  createAPIKey: PropTypes.func.isRequired
};

export default function ApiKeyListRoute() {
  const state = useApiKeysState();

  const {
    loaded,
    apiKeys,
    enableCreateApiKeyCreation,
    reachedLimit,
    limits,
    isLegacyOrganization,
    createAPIKey
  } = state;

  const hasApiKeys = apiKeys.length > 0;

  return (
    <ApiKeysWorkbench
      sidebar={
        <React.Fragment>
          {enableCreateApiKeyCreation && (
            <AddApiKeys
              loaded={loaded}
              usedAPIKeys={apiKeys.length}
              reachedLimit={reachedLimit}
              limits={limits}
              isLegacyOrganization={isLegacyOrganization}
              createAPIKey={createAPIKey}
            />
          )}
          <StaffHint />
          <Documentation />
        </React.Fragment>
      }>
      <ApiKeysNavigation currentTab="cda-tokens" />
      {loaded === false && (
        <SkeletonContainer
          clipId="loading-api-keys"
          ariaLabel="Loading..."
          svgWidth="60%"
          svgHeight={300}>
          <SkeletonBodyText numberOfLines={5} />
        </SkeletonContainer>
      )}
      {loaded === true && <ApiKeyList apiKeys={apiKeys} />}
      {loaded === true && hasApiKeys === false && <EmptyStateAdvice />}
    </ApiKeysWorkbench>
  );
}
