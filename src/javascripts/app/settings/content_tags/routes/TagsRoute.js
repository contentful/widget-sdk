import DocumentTitle from 'components/shared/DocumentTitle';
import TagsWorkbenchSkeleton from '../skeletons/TagsWorkbenchSkeleton';
import React, { useCallback } from 'react';
import TagsList from '../components/TagsList';
import { EmptyState } from '@contentful/forma-36-react-components';
import ReadTagsProvider, { ReadTags } from '../providers/ReadTagsProvider';
import Pagination from 'app/common/Pagination';
import { useTagsFeatureEnabled } from '../hooks/useTagsFeatureEnabled';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect';
import TagsRepoProvider from '../providers/TagsRepoProvider';

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
        <ReadTags.Consumer>
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
        </ReadTags.Consumer>
      </ReadTagsProvider>
    </TagsRepoProvider>
  );
}

TagsRoute.propTypes = {
  redirectUrl: PropTypes.string,
};

export default TagsRoute;
