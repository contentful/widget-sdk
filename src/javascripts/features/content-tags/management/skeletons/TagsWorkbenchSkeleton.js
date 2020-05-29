import React, { useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Paragraph,
  SkeletonBodyText,
  SkeletonContainer,
  Typography,
  Workbench,
} from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';
import BinocularsIllustration from 'svg/illustrations/binoculars-illustration.svg';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import {
  useF36Modal,
  useIsInitialLoadingOfTags,
  useScrollToTop,
} from 'features/content-tags/core/hooks';
import { TagsWorkbenchActions } from './TagsWorkbenchActions';
import { CreateTagModal } from 'features/content-tags/management/components/CreateTagModal';
import { NoTagsContainer } from 'features/content-tags/core/components/NoTagsContainer';

function TagsWorkbenchSkeleton(props) {
  const scrollToTop = useScrollToTop('.tags-workbench-content');
  const { modalComponent: createTagComponent, showModal: showCreateTagModal } = useF36Modal(
    CreateTagModal
  );
  const isInitialLoad = useIsInitialLoadingOfTags();

  const onCreate = useCallback(() => {
    showCreateTagModal();
  }, [showCreateTagModal]);

  useEffect(() => {
    if (!props.isLoading) {
      scrollToTop();
    }
  }, [scrollToTop, props.isLoading]);

  const renderDefaultContent = useCallback(() => {
    return (
      <SkeletonContainer
        svgWidth="100%"
        svgHeight={300}
        ariaLabel="Loading tags"
        clipId="loading-tags">
        <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
      </SkeletonContainer>
    );
  }, []);

  const renderNoTags = useCallback(() => {
    return <NoTagsContainer onCreate={onCreate} />;
  }, [onCreate]);

  const renderNoResult = useCallback(() => {
    return (
      <EmptyStateContainer>
        <BinocularsIllustration className={defaultSVGStyle} />
        <Typography>
          <Heading>No tags found</Heading>
          <Paragraph>Check if your spelling is correct</Paragraph>
        </Typography>
      </EmptyStateContainer>
    );
  }, []);

  const content = useMemo(() => {
    if (isInitialLoad) {
      return renderDefaultContent();
    } else if (props.hasTags && !props.isLoading && !props.hasData) {
      return renderNoResult();
    } else if (!props.hasTags && !props.isLoading) {
      return renderNoTags();
    } else {
      return props.children || renderDefaultContent();
    }
  }, [
    isInitialLoad,
    props.isLoading,
    props.hasTags,
    props.children,
    props.hasData,
    renderDefaultContent,
    renderNoResult,
    renderNoTags,
  ]);

  return (
    <Workbench className={props.className}>
      {createTagComponent}
      <div id={'content-tags-modal'} />
      <Workbench.Header
        title={'Tags'}
        actions={<TagsWorkbenchActions hasData={props.hasTags} onCreate={onCreate} />}
        icon={<NavigationIcon icon="settings" color="green" size="large" />}
      />
      <Workbench.Content type="default" className={'tags-workbench-content'}>
        <>{content}</>
      </Workbench.Content>
    </Workbench>
  );
}

TagsWorkbenchSkeleton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  isLoading: PropTypes.bool,
  hasTags: PropTypes.bool,
  hasData: PropTypes.bool,
};

export { TagsWorkbenchSkeleton };
