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
  Heading,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { ApiKeysWorkbench } from '../ApiKeysWorkbench';
import { ApiKeysNavigation } from '../ApiKeysNavigation';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { ApiKeyList } from '../api-keys-list/ApiKeyList';
import { useApiKeysState } from '../api-keys-list/ApiKeyListState';
import * as Navigator from 'states/Navigator';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import ApiKeysEmptyIllustration from '../svg/api-keys-empty-illustation.svg';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const styles = {
  actions: css({
    display: 'flex',
    alignItems: 'center',
    button: {
      marginLeft: tokens.spacingM,
    },
  }),
};

const EmptyState = () => (
  <EmptyStateContainer data-test-id="api-keys.empty">
    <div className={defaultSVGStyle}>
      <ApiKeysEmptyIllustration />
    </div>
    <Heading>Add the first API key to start delivering content</Heading>
    <Paragraph>
      To learn more about delivering content, read about{' '}
      <KnowledgeBase target="content_apis" text="four content APIs" /> or{' '}
      <KnowledgeBase target="delivery_api" text="content delivery API reference documentation" />.
      If you are delivering content to multiple platforms, consider adding multiple API keys.
    </Paragraph>
  </EmptyStateContainer>
);

function Documentation() {
  return (
    <WorkbenchSidebarItem title="Documentation">
      <List>
        <ListItem>
          Learn more about the <KnowledgeBase target="content_apis" text="four content APIs" />.
        </ListItem>
        <ListItem>
          Read the{' '}
          <KnowledgeBase target="delivery_api" text="reference docs for the content delivery API" />
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
  limits: PropTypes.shape({
    maximum: PropTypes.number,
  }),
  usedAPIKeys: PropTypes.number.isRequired,
};

function AddApiKeys(props) {
  const [creating, setCreating] = useState(false);

  const onCreateClick = () => {
    setCreating(true);
    props
      .createAPIKey()
      .then((apiKey) => {
        Navigator.go({ path: '^.detail', params: { apiKeyId: apiKey.sys.id } });
      })
      .catch((err) => {
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
  createAPIKey: PropTypes.func.isRequired,
};

export function ApiKeyListRoute() {
  const { currentSpaceId, currentOrganization, currentSpaceName } = useSpaceEnvContext();
  const state = useApiKeysState({
    spaceId: currentSpaceId,
    spaceName: currentSpaceName,
    organization: currentOrganization,
  });

  const {
    loaded,
    apiKeys,
    enableCreateApiKeyCreation,
    reachedLimit,
    limits,
    isLegacyOrganization,
    createAPIKey,
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
