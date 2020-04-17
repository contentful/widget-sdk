import React from 'react';
import PropTypes from 'prop-types';
import NavigationIcon from 'ui/Components/NavigationIcon';
import { Workbench } from '@contentful/forma-36-react-components';
import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';

function WebhookLoading() {
  return (
    <Workbench testId="webhooks.list">
      <Workbench.Header icon={<NavigationIcon icon="settings" color="green" size="large" />} />
      <Workbench.Content type="full">
        <SkeletonContainer
          svgWidth={600}
          svgHeight={300}
          ariaLabel="Loading webhook page"
          clipId="loading-webhook-page">
          <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
        </SkeletonContainer>
      </Workbench.Content>
    </Workbench>
  );
}

function WebhooksListLoading() {
  return (
    <ListShell>
      <SkeletonContainer
        svgWidth={600}
        svgHeight={300}
        ariaLabel="Loading webhooks"
        clipId="loading-webhooks">
        <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
      </SkeletonContainer>
    </ListShell>
  );
}

function ListShell(props) {
  return (
    <Workbench testId="webhooks.list">
      <Workbench.Header
        icon={<NavigationIcon icon="settings" color="green" size="large" />}
        title={props.title}
        actions={props.actions}
      />
      <Workbench.Content type="full">{props.children}</Workbench.Content>
      <Workbench.Sidebar position="right">{props.sidebar || <div />}</Workbench.Sidebar>
    </Workbench>
  );
}

ListShell.propTypes = {
  sidebar: PropTypes.any,
  actions: PropTypes.any,
  title: PropTypes.string,
};

ListShell.defaultProps = {
  title: 'Webhooks',
};

export const WebhookSkeletons = {
  ListShell,
  WebhooksListLoading,
  WebhookLoading,
};
