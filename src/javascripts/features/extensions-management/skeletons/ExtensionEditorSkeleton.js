import React from 'react';
import PropTypes from 'prop-types';

import {
  SkeletonContainer,
  SkeletonBodyText,
  SkeletonDisplayText,
  Heading,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

export const ExtensionEditorSkeleton = (props) => (
  <Workbench>
    <Workbench.Header
      onBack={() => {
        props.goToList();
      }}
      icon={<ProductIcon icon="Settings" size="large" />}
      title={
        <>
          {props.title && <Heading>{props.title}</Heading>}
          {!props.title && (
            <SkeletonContainer svgHeight={21} clipId="header">
              <SkeletonDisplayText lineHeight={21} />
            </SkeletonContainer>
          )}
        </>
      }
      actions={props.actions}
    />
    <Workbench.Content>
      {props.children || (
        <SkeletonContainer
          svgWidth={600}
          svgHeight={300}
          ariaLabel="Loading extension..."
          clipId="content">
          <SkeletonBodyText numberOfLines={5} offsetLeft={28} marginBottom={15} offsetTop={18} />
        </SkeletonContainer>
      )}
    </Workbench.Content>
  </Workbench>
);

ExtensionEditorSkeleton.propTypes = {
  goToList: PropTypes.func.isRequired,
  title: PropTypes.string,
  actions: PropTypes.node,
};
