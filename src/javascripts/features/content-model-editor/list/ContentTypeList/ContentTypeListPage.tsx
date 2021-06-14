import React, { useCallback, useState } from 'react';
import {
  Heading,
  SkeletonBodyText,
  SkeletonContainer,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ContentTypeList } from './ContentTypeList';
import { NoSearchResultsAdvice } from 'core/components/NoSearchResultsAdvice';
import { NoContentTypeAdvice } from 'core/components/NoContentTypeAdvice';
import { CreateContentTypeCta } from '../CreateContentTypeCta';
import KnowledgeBase, {
  KnowledgeBaseItems,
} from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { ContentTypeListSearch } from './ContentTypeListSearch';
import { ContentTypeListFilter } from './ContentTypeListFilter';
import * as service from './ContentTypeListService';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { css } from 'emotion';
import { useAsync } from 'core/hooks';
import { debounce } from 'lodash';
import qs from 'qs';
import tokens from '@contentful/forma-36-tokens';
import { UpgradeBanner } from './UpgradeBanner';
import { useLegacyQueryParams } from 'core/react-routing/useLegacyQueryParams';

const styles = {
  knowledgeBaseIcon: css({
    lineHeight: tokens.lineHeightXl,
    marginLeft: tokens.spacing2Xs,
    padding: `0 ${tokens.spacing2Xs}`,
    fontSize: tokens.fontSizeXl,
    display: 'flex',
  }),
};

export function ContentTypeListPage() {
  const { searchQuery, updateSearchQuery } = useLegacyQueryParams();
  const queryValues = searchQuery ? qs.parse(searchQuery.slice(1)) : {};
  const [searchTerm, setSearchTerm] = useState(queryValues ? queryValues.searchTerm : null);
  const [status, setStatus] = useState(undefined);

  const getData = useCallback(async () => {
    const contentTypes = await service.fetchContentTypes();

    return {
      contentTypes,
    };
  }, []);

  const { isLoading, data } = useAsync(getData);
  const debouncedSearch = useCallback(
    debounce<(term: string) => void>((searchTerm) => {
      setSearchTerm(searchTerm);
      updateSearchQuery({ searchTerm });
    }, 200),
    []
  );

  const search = (value) => {
    debouncedSearch(value);
  };

  const renderSidebar = () => {
    if (!isLoading && data?.contentTypes.length === 0) {
      return null;
    }

    return (
      <Workbench.Sidebar position="left">
        {!isLoading && (
          <ContentTypeListFilter status={status} onChange={(status) => setStatus(status)} />
        )}
      </Workbench.Sidebar>
    );
  };

  let filteredContentTypes = [];
  if (!isLoading) {
    filteredContentTypes = service.filterContentTypes(data?.contentTypes || [], {
      searchTerm,
      status,
    });
  }

  return (
    <Workbench>
      <Workbench.Header
        icon={<ProductIcon icon="ContentModel" size="large" />}
        title={
          <>
            <Heading>Content Model</Heading>
            <div className={styles.knowledgeBaseIcon}>
              <KnowledgeBase target={KnowledgeBaseItems.content_model} asIcon />
            </div>
          </>
        }
        actions={
          <>
            {!isLoading && data?.contentTypes.length > 0 && (
              <ContentTypeListSearch searchTerm={searchTerm} onChange={(value) => search(value)} />
            )}
            {!isLoading && data?.contentTypes.length > 0 && (
              <CreateContentTypeCta testId="create-content-type" />
            )}
          </>
        }
      />

      {renderSidebar()}

      <Workbench.Content type="full">
        {isLoading ? (
          <SkeletonContainer
            data-test-id="content-loader"
            ariaLabel="Loading Content Type list"
            svgWidth="100%">
            <SkeletonBodyText numberOfLines={2} />
            <SkeletonBodyText numberOfLines={2} offsetTop={75} />
            <SkeletonBodyText numberOfLines={2} offsetTop={150} />
            <SkeletonBodyText numberOfLines={2} offsetTop={225} />
            <SkeletonBodyText numberOfLines={2} offsetTop={300} />
            <SkeletonBodyText numberOfLines={2} offsetTop={375} />
          </SkeletonContainer>
        ) : (
          <React.Fragment>
            <UpgradeBanner />

            {filteredContentTypes.length > 0 && (
              <div data-test-id="content-type-list">
                <ContentTypeList contentTypes={filteredContentTypes} />
              </div>
            )}
            {data?.contentTypes.length > 0 && filteredContentTypes.length === 0 && (
              <div data-test-id="no-search-results">
                <NoSearchResultsAdvice />
              </div>
            )}
            {data?.contentTypes.length === 0 && (
              <div data-test-id="empty-state">
                <NoContentTypeAdvice />
              </div>
            )}
          </React.Fragment>
        )}
      </Workbench.Content>
    </Workbench>
  );
}
