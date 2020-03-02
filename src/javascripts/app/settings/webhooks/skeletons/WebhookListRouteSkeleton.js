import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon';
import { Workbench } from '@contentful/forma-36-react-components';
import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';

export function WebhookLoadingSkeleton() {
  return (
    <Workbench testId="webhooks.list">
      <Workbench.Header icon={<Icon name="page-settings" scale="0.8" />} />
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

export function WebhooksListLoadingSkeleton() {
  return (
    <WebhookListShell>
      <SkeletonContainer
        svgWidth={600}
        svgHeight={300}
        ariaLabel="Loading webhooks"
        clipId="loading-webhooks">
        <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
      </SkeletonContainer>
    </WebhookListShell>
  );
}

export function WebhookListShell(props) {
  return (
    <Workbench testId="webhooks.list">
      <Workbench.Header
        icon={<Icon name="page-settings" scale="0.8" />}
        title={props.title}
        actions={props.actions}
      />
      <Workbench.Content type="full">{props.children}</Workbench.Content>
      <Workbench.Sidebar position="right">{props.sidebar || <div />}</Workbench.Sidebar>
    </Workbench>
  );
}

WebhookListShell.propTypes = {
  sidebar: PropTypes.any,
  actions: PropTypes.any,
  title: PropTypes.string
};

WebhookListShell.defaultProps = {
  title: 'Webhooks'
};
