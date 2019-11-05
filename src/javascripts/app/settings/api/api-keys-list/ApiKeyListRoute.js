import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  List,
  ListItem,
  SkeletonContainer,
  SkeletonBodyText,
  Paragraph,
  Button,
  Notification,
  Heading
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ApiKeysWorkbench from '../ApiKeysWorkbench';
import ApiKeysNavigation from '../ApiKeysNavigation';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';
import ApiKeyList from './ApiKeyList';
import { useApiKeysState } from './ApiKeyListState';
import * as Navigator from 'states/Navigator.es6';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import ApiKeysEmptyIllustration from 'svg/api-keys-empty-illustation';

const styles = {
  actions: css({
    display: 'flex',
    alignItems: 'center',
    button: {
      marginLeft: tokens.spacingM
    }
  })
};

const EmptyState = () => (
  <EmptyStateContainer data-test-id="api-keys.empty">
    <div className={defaultSVGStyle}>
      <ApiKeysEmptyIllustration />
    </div>
    <Heading>Add the first API key to start delivering content</Heading>
    <Paragraph>
      To learn more about delivering content, read about{' '}
      <KnowledgeBase target="content_apis" text="four content APIs" inlineText /> or{' '}
      <KnowledgeBase
        target="delivery_api"
        text="content delivery API reference documentation"
        inlineText
      />
      . If you are delivering content to multiple platforms, consider adding multiple API keys.
    </Paragraph>
  </EmptyStateContainer>
);

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
    <div className={styles.actions}>
      {props.loaded && props.usedAPIKeys > 0 && <UsageInformation {...props} />}
      <Button
        testId="add-api-key"
        loading={creating}
        disabled={!props.loaded || props.reachedLimit}
        buttonType="primary"
        icon="PlusCircle"
        onClick={onCreateClick}>
        Add API key
      </Button>
    </div>
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
      actions={
        enableCreateApiKeyCreation ? (
          <AddApiKeys
            loaded={loaded}
            usedAPIKeys={apiKeys.length}
            reachedLimit={reachedLimit}
            limits={limits}
            isLegacyOrganization={isLegacyOrganization}
            createAPIKey={createAPIKey}
          />
        ) : null
      }
      sidebar={
        <React.Fragment>
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
      {loaded === true && (
        <div data-test-id="api-key-list">
          {hasApiKeys && <ApiKeyList apiKeys={apiKeys} />}
          {!hasApiKeys && <EmptyState />}
        </div>
      )}
    </ApiKeysWorkbench>
  );
}
