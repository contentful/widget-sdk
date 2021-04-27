import DocumentTitle from 'components/shared/DocumentTitle';
import React, { useCallback } from 'react';
import { EmptyState } from '@contentful/forma-36-react-components';
import Pagination from 'app/common/Pagination';
import StateRedirect from 'app/common/StateRedirect';
import { ReadTagsContext } from 'features/content-tags/core/state/ReadTagsContext';
import { useTagsFeatureEnabled } from 'features/content-tags/core/hooks/useTagsFeatureEnabled';
import { TagsWorkbenchSkeleton } from 'features/content-tags/management/skeletons/TagsWorkbenchSkeleton';
import { TagsList } from 'features/content-tags/management/components/TagsList';
import { MetadataTags } from 'features/content-tags';
import { FilteredTagsContext } from 'features/content-tags/core/state/FilteredTagsContext';
import { Route, RouteErrorBoundary, Routes } from 'core/react-routing';

function TagsRoute({ redirectUrl = 'spaces.detail' }) {
  const { tagsEnabled, isTagsEnabledLoading } = useTagsFeatureEnabled();

  const renderError = useCallback(() => {
    return (
      <EmptyState
        headingProps={{
          elementType: 'h1',
          text: 'Error loading tags',
        }}
        descriptionProps={{
          text: 'please try reloading page',
          elementType: 'p',
        }}
      />
    );
  }, []);
  if (isTagsEnabledLoading) {
    return null;
  }

  if (!tagsEnabled) {
    return <StateRedirect path={redirectUrl} />;
  }

  return (
    <MetadataTags>
      <DocumentTitle title="Content Tags" />
      <ReadTagsContext.Consumer>
        {({ error, isLoading, total, hasTags }) => {
          return (
            <FilteredTagsContext.Consumer>
              {({ filteredTags, limit, setLimit, skip, setSkip }) => {
                return (
                  <TagsWorkbenchSkeleton
                    isLoading={isLoading}
                    hasTags={hasTags}
                    hasData={filteredTags && filteredTags.length > 0}>
                    {error ? (
                      renderError()
                    ) : (
                      <>
                        <TagsList tags={filteredTags || []} isLoading={isLoading} />
                        <Pagination
                          skip={skip}
                          limit={limit}
                          total={total}
                          loading={isLoading}
                          onChange={(change) => {
                            setSkip(change.skip);
                            setLimit(change.limit);
                          }}
                        />
                      </>
                    )}
                  </TagsWorkbenchSkeleton>
                );
              }}
            </FilteredTagsContext.Consumer>
          );
        }}
      </ReadTagsContext.Consumer>
    </MetadataTags>
  );
}

export const TagsRouter = () => (
  <RouteErrorBoundary>
    <Routes>
      <Route name="spaces.detail.settings.tags.list" path="/" element={<TagsRoute />} />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  </RouteErrorBoundary>
);
