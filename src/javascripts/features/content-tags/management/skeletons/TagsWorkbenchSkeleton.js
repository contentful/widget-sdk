import React, { useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  SkeletonBodyText,
  SkeletonContainer,
  Typography,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
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
import { TagListHeader } from 'features/content-tags/management/components/TagListHeader';

function TagsWorkbenchSkeleton({ isLoading, hasTags, children, hasData, className }) {
  const scrollToTop = useScrollToTop('.tags-workbench-content');
  const { modalComponent: createTagComponent, showModal: showCreateTagModal } = useF36Modal(
    CreateTagModal
  );
  const isInitialLoad = useIsInitialLoadingOfTags();

  const onCreate = useCallback(() => {
    showCreateTagModal();
  }, [showCreateTagModal]);

  useEffect(() => {
    if (!isLoading) {
      scrollToTop();
    }
  }, [scrollToTop, isLoading]);

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
        </Typography>
      </EmptyStateContainer>
    );
  }, []);

  const content = useMemo(() => {
    if (isInitialLoad) {
      return renderDefaultContent();
    } else if (hasTags && !isLoading && !hasData) {
      return renderNoResult();
    } else if (!hasTags && !isLoading) {
      return renderNoTags();
    } else {
      return children || renderDefaultContent();
    }
  }, [
    isInitialLoad,
    isLoading,
    hasTags,
    children,
    hasData,
    renderDefaultContent,
    renderNoResult,
    renderNoTags,
  ]);

  return (
    <Workbench className={className}>
      {createTagComponent}
      <Workbench.Header
        title={'Tags'}
        actions={<TagsWorkbenchActions hasData={hasTags} onCreate={onCreate} />}
        icon={<ProductIcon icon="Settings" size="large" tag={'span'} />}
      />
      <Workbench.Content type="default" className={'tags-workbench-content'}>
        {hasTags && <TagListHeader />}
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
