import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  SkeletonContainer,
  SkeletonBodyText,
  SkeletonDisplayText,
  Heading,
  Workbench,
} from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import NavigationIcon from 'ui/Components/NavigationIcon';

import {
  WhatIsContentPreview,
  TokensForContentPreview,
  LinkedEntries,
  LegacyTokens,
} from '../ContentPreviewSidebar';

export const ContentPreviewFormSkeleton = (props) => {
  return (
    <Workbench>
      <Workbench.Header
        onBack={() => {
          Navigator.go({ path: '^.list' });
        }}
        icon={<NavigationIcon icon="settings" color="green" size="large" />}
        title={
          <>
            {props.title && <Heading>{props.title}</Heading>}
            {!props.title && (
              <SkeletonContainer svgHeight={21} clipId="title">
                <SkeletonDisplayText lineHeight={21} />
              </SkeletonContainer>
            )}
          </>
        }
        actions={
          props.actions || (
            <SkeletonContainer svgHeight={21} svgWidth={100} clipId="actions">
              <SkeletonDisplayText lineHeight={21} />
            </SkeletonContainer>
          )
        }
      />
      <Workbench.Content>
        {props.children || (
          <Form className="content-preview-editor">
            <Heading className="section-title" element="h3">
              General information
            </Heading>
            <SkeletonContainer svgWidth={600} ariaLabel="Loading content type..." clipId="content">
              <SkeletonBodyText numberOfLines={5} marginBottom={15} />
            </SkeletonContainer>
          </Form>
        )}
      </Workbench.Content>
      <Workbench.Sidebar position="right">
        <WhatIsContentPreview />
        <TokensForContentPreview />
        <LinkedEntries />
        <LegacyTokens />
      </Workbench.Sidebar>
    </Workbench>
  );
};

ContentPreviewFormSkeleton.propTypes = {
  title: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node,
};
