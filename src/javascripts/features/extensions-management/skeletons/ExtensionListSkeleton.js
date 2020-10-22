import React from 'react';
import PropTypes from 'prop-types';
import {
  SkeletonContainer,
  SkeletonBodyText,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { ExtensionsSidebar } from '../ExtensionsSidebar';

export const ExtensionListSkeleton = (props) => (
  <Workbench>
    <Workbench.Header
      title={props.title || 'Extensions'}
      icon={<ProductIcon icon="Settings" size="large" />}
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
  actions: PropTypes.node,
};
