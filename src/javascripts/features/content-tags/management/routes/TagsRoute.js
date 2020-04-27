import DocumentTitle from 'components/shared/DocumentTitle';
import React, { useCallback } from 'react';
import { EmptyState } from '@contentful/forma-36-react-components';
import Pagination from 'app/common/Pagination';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect';
import { ReadTagsContext } from 'features/content-tags/core/state/ReadTagsContext';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';
import { useTagsFeatureEnabled } from 'features/content-tags/core/hooks/useTagsFeatureEnabled';
import { TagsWorkbenchSkeleton } from 'features/content-tags/management/skeletons/TagsWorkbenchSkeleton';
import { TagsRepoProvider } from 'features/content-tags/core/state/TagsRepoProvider';
import { TagsList } from 'features/content-tags/management/components/TagsList';

/**
 * @return {null}
 */
function TagsRoute({ redirectUrl }) {
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
    <TagsRepoProvider>
      <ReadTagsProvider>
        <DocumentTitle title="Content Tags" />
        <ReadTagsContext.Consumer>
          {({
            data,
            error,
            isLoading,
            reloadAll,
            skip,
            setSkip,
            limit,
            setLimit,
            total,
            hasTags,
          }) => {
            return (
              <TagsWorkbenchSkeleton
                isLoading={isLoading}
                hasTags={hasTags}
                hasData={data && data.length > 0}>
                {error ? (
                  renderError(error, reloadAll)
                ) : (
                  <>
                    <TagsList tags={data || []} isLoading={isLoading} />
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
        </ReadTagsContext.Consumer>
      </ReadTagsProvider>
    </TagsRepoProvider>
  );
}

TagsRoute.propTypes = {
  redirectUrl: PropTypes.string,
};

const tagsState = {
  name: 'tags',
  url: '/tags',
  component: (props) => <TagsRoute {...props} redirectUrl={'spaces.detail'} />,
};

export { TagsRoute, tagsState };
