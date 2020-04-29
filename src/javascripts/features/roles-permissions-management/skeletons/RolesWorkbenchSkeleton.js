import React from 'react';
import PropTypes from 'prop-types';
import {
  SkeletonContainer,
  SkeletonBodyText,
  SkeletonDisplayText,
  Workbench,
} from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';

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
        icon={<NavigationIcon icon="settings" color="green" size="large" />}></Workbench.Header>
      <Workbench.Content type="default">
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
      {props.sidebar && <Workbench.Sidebar position="right">{props.sidebar}</Workbench.Sidebar>}
    </Workbench>
  );
}

RolesWorkbenchSkeleton.propTypes = {
  className: PropTypes.string,
  onBack: PropTypes.func,
  actions: PropTypes.node,
  title: PropTypes.node.isRequired,
  children: PropTypes.node,
  sidebar: PropTypes.node,
};
