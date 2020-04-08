import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  SkeletonBodyText,
  SkeletonContainer,
  Workbench,
} from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';
import useScrollToTop from 'app/common/hooks/useScrollToTop';

function TagsWorkbenchSkeleton(props) {
  const scrollToTop = useScrollToTop('.tags-workbench-content');

  useEffect(() => {
    if (!props.isLoading) scrollToTop();
  }, [scrollToTop, props.isLoading]);

  return (
    <Workbench className={props.className}>
      <div id={'content-tags-modal'} />
      <Workbench.Header
        title={'Tags'}
        actions={props.actions}
        icon={<NavigationIcon icon="settings" color="green" size="large" />}
      />
      <Workbench.Content type="default" className={'tags-workbench-content'}>
        {props.children || (
          <SkeletonContainer
            svgWidth="100%"
            svgHeight={300}
            ariaLabel="Loading tags"
            clipId="loading-tags">
            <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
          </SkeletonContainer>
        )}
      </Workbench.Content>
    </Workbench>
  );
}

TagsWorkbenchSkeleton.propTypes = {
  className: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node,
  isLoading: PropTypes.bool,
};

export default TagsWorkbenchSkeleton;
