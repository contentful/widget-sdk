import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Heading,
  Paragraph,
  SkeletonBodyText,
  SkeletonContainer,
  Typography,
  Workbench,
} from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';
import EmptyContentTags from 'svg/illustrations/empty-content-tags.svg';
import BinocularsIllustration from 'svg/illustrations/binoculars-illustration.svg';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import { useScrollToTop, useF36Modal } from 'features/content-tags/core/hooks';
import { TagsWorkbenchActions } from './TagsWorkbenchActions';
import { CreateTagModal } from 'features/content-tags/management/components/CreateTagModal';

function TagsWorkbenchSkeleton(props) {
  const scrollToTop = useScrollToTop('.tags-workbench-content');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { modalComponent: createTagComponent, showModal: showCreateTagModal } = useF36Modal(
    CreateTagModal
  );

  const onCreate = useCallback(() => {
    showCreateTagModal();
  }, [showCreateTagModal]);

  useEffect(() => {
    if (!props.isLoading) {
      setIsInitialLoad(false);
      scrollToTop();
    }
  }, [scrollToTop, setIsInitialLoad, props.isLoading]);

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
    return (
      <EmptyStateContainer>
        <EmptyContentTags className={defaultSVGStyle} />
        <Typography>
          <Heading>Organize your content with tags</Heading>
          <Paragraph>
            Group content with tags to make it easier to find what you need. You can filter for tags
            across content types and use tags to improve your workflows.
          </Paragraph>
          <Button buttonType="primary" onClick={onCreate}>
            Add first tag
          </Button>
        </Typography>
      </EmptyStateContainer>
    );
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
      return null;
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
  actions: PropTypes.node,
  children: PropTypes.node,
  isLoading: PropTypes.bool,
  hasTags: PropTypes.bool,
  hasData: PropTypes.bool,
};

export { TagsWorkbenchSkeleton };
