import React from 'react';
import PropTypes from 'prop-types';
import {
  SkeletonContainer,
  SkeletonBodyText,
  SkeletonDisplayText,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { css } from 'emotion';

const styles = {
  workbenchContent: css({
    padding: 0,
  }),
};

export function RolesWorkbenchSkeleton(props) {
  return (
    <Workbench className={props.className}>
      <Workbench.Header
        onBack={props.onBack}
        title={
          props.title || (
            <SkeletonContainer svgHeight={21} svgWidth={100} clipId="roles-title">
              <SkeletonDisplayText lineHeight={21} />
            </SkeletonContainer>
          )
        }
        actions={
          props.actions || (
            <SkeletonContainer svgHeight={21} svgWidth={100} clipId="roles-actions">
              <SkeletonDisplayText lineHeight={21} />
            </SkeletonContainer>
          )
        }
        icon={<ProductIcon icon="Settings" size="large" />}
      />
      <Workbench.Content type={props.type || 'default'} className={styles.workbenchContent}>
        {props.children || (
          <SkeletonContainer
            svgWidth="100%"
            svgHeight={300}
            ariaLabel="Loading roles"
            clipId="loading-roles">
            <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
          </SkeletonContainer>
        )}
      </Workbench.Content>
    </Workbench>
  );
}

RolesWorkbenchSkeleton.propTypes = {
  className: PropTypes.string,
  onBack: PropTypes.func,
  actions: PropTypes.node,
  title: PropTypes.node,
  children: PropTypes.node,
  type: PropTypes.oneOf(['default', 'full']),
};
