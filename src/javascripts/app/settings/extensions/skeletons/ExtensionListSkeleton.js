import React from 'react';
import PropTypes from 'prop-types';
import {
  SkeletonContainer,
  SkeletonBodyText,
  Workbench
} from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import ExtensionsSidebar from '../ExtensionsSidebar';

export const ExtensionListSkeleton = props => (
  <Workbench>
    <Workbench.Header
      title={props.title || 'Extensions'}
      icon={<Icon name="page-settings" scale="0.8" />}
      actions={props.actions}
    />
    <Workbench.Content type="full">
      {props.children || (
        <React.Fragment>
          <SkeletonContainer
            svgWidth={600}
            svgHeight={300}
            ariaLabel="Loading extensions list..."
            clipId="extesions-loading-list">
            <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
          </SkeletonContainer>
        </React.Fragment>
      )}
    </Workbench.Content>
    <Workbench.Sidebar position="right">
      <ExtensionsSidebar />
    </Workbench.Sidebar>
  </Workbench>
);

ExtensionListSkeleton.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.node
};
