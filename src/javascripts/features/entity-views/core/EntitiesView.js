import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Workbench } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { Sidebar as SavedViewsSidebar } from './SavedViews/Sidebar';
import { css } from 'emotion';
import { Paginator } from 'core/components/Paginator';
import { RecordsResourceUsage } from './RecordsResourceUsage';
import tokens from '@contentful/forma-36-tokens';
import { noop } from 'lodash';
import { NoSearchResultsAdvice } from 'core/components/NoSearchResultsAdvice';
import { UpgradeBanner } from './UpgradeBanner';
import { PluralizeEntityMessage } from './PluralizeEntityMessage';
import { EntitySearch, usePaginator, useSearchController } from 'features/entity-search';
import { getCreatableContentTypes, getReadableContentTypes } from 'data/ContentTypeRepo/filter';
import { useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { LoadingEmptyState } from 'features/loading-state';
import { useTagsFeatureEnabled } from 'features/content-tags';

const statusStyles = {
  padding: `0 ${tokens.spacingM} ${tokens.spacingS} ${tokens.spacingM}`,
  color: tokens.colorTextLightest,
};

const styles = {
  sidebar: css({
    padding: 0,
    overflowY: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }),
  search: css({
    flexBasis: '60%',
  }),
  addButton: css({
    marginLeft: 'auto',
  }),
  header: css({
    width: '100%',
    display: 'flex',
    marginLeft: '4.5rem',
    alignItems: 'center',
  }),
  paginator: css({
    margin: `${tokens.spacingS} 0`,
  }),
  searchResults: css({
    float: 'left',
    ...statusStyles,
  }),
  usageResults: css({
    float: 'right',
    ...statusStyles,
  }),
  flex: css({
    display: 'flex',
  }),
  loader: css({
    alignSelf: 'center',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
  }),
  spinner: css({
    display: 'block',
  }),
  spinnerText: css({
    marginLeft: tokens.spacingS,
    fontSize: tokens.fontSize2Xl,
  }),
  info: css({
    fontSize: tokens.fontSizeXl,
  }),
};

export const EntitiesView = ({
  entityType,
  fetchEntities,
  listViewContext,
  renderAddEntityActions,
  renderEmptyState,
  renderEntityList,
  renderSavedViewsActions,
  renderTopContent,
  searchControllerProps,
  title,
  environmentId,
  isMasterEnvironment,
  space,
}) => {
  const paginator = usePaginator();
  const [isInitialized, setIsInitialized] = useState(false);
  const { contentTypeId } = listViewContext.getView();

  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const { tagsEnabled, isTagsEnabledLoading } = useTagsFeatureEnabled();

  const [
    { isLoading: searchLoading, entities, hasEntities, hasNoSearchResults, showNoEntitiesAdvice },
    { updateEntities },
  ] = useSearchController({
    listViewContext,
    paginator,
    fetchEntities,
    cache: searchControllerProps.cache,
    getListQuery: searchControllerProps.getListQuery,
    keys: searchControllerProps.keys,
  });
  const isLoading = isTagsEnabledLoading || searchLoading;
  const pageCount = paginator.getPageCount();

  const onSelect = useCallback(
    (page = 0) => {
      paginator.setPage(page);
      updateEntities();
    },
    [paginator, updateEntities]
  );
  const onSelectSavedView = useCallback(() => onSelect(), [onSelect]);
  const onUpdateSearch = useCallback(() => onSelect(), [onSelect]);

  useEffect(() => {
    !isLoading && setIsInitialized(true);
  }, [isLoading]);

  const { readableContentTypes, creatableContentTypes } = useMemo(
    () => ({
      readableContentTypes: getReadableContentTypes(currentSpaceContentTypes, contentTypeId),
      creatableContentTypes: getCreatableContentTypes(currentSpaceContentTypes),
    }),
    [contentTypeId, currentSpaceContentTypes, isInitialized] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const renderPropArgs = {
    entities,
    isLoading,
    updateEntities,
    showNoEntitiesAdvice,
    contentTypes: currentSpaceContentTypes,
    readableContentTypes,
    creatableContentTypes,
  };

  return (
    <Fragment>
      <DocumentTitle title={title} />
      {!isInitialized ? (
        <Workbench className={styles.flex}>
          <LoadingEmptyState testId="cf-ui-loading-state" />
        </Workbench>
      ) : (
        <Workbench testId={`${entityType}-view`}>
          <Workbench.Header
            title={title}
            description={<KnowledgeBase target={entityType} className={styles.info} asIcon />}
            icon={<ProductIcon icon={title} size="large" />}
            actions={
              <div className={styles.header}>
                <EntitySearch
                  className={styles.search}
                  entityType={entityType}
                  isLoading={isLoading}
                  listViewContext={listViewContext}
                  onUpdate={onUpdateSearch}
                  contentTypes={readableContentTypes}
                  withMetadata={tagsEnabled}
                />
                <div id="saved-views-link-portal-entry" />
                {!showNoEntitiesAdvice && renderAddEntityActions(renderPropArgs, styles.addButton)}
              </div>
            }
          />
          {!showNoEntitiesAdvice && (
            <Workbench.Sidebar
              position="left"
              className={styles.sidebar}
              testId="workbench-sidebar">
              {renderSavedViewsActions(renderPropArgs)}
              <SavedViewsSidebar
                entityType={entityType}
                listViewContext={listViewContext}
                onSelectSavedView={onSelectSavedView}
              />
            </Workbench.Sidebar>
          )}
          <Workbench.Content type="full" className={styles.flex} testId="workbench-content">
            {showNoEntitiesAdvice ? (
              renderEmptyState(renderPropArgs)
            ) : (
              <Fragment>
                {renderTopContent(renderPropArgs)}
                <UpgradeBanner />
                {hasEntities && (
                  <Fragment>
                    <PluralizeEntityMessage
                      className={styles.searchResults}
                      entityType={entityType}
                      count={paginator.getTotal()}
                      restOfTheMsg="found"
                    />
                    <RecordsResourceUsage
                      className={styles.usageResults}
                      space={space}
                      environmentId={environmentId}
                      isMasterEnvironment={isMasterEnvironment}
                    />
                    {!hasNoSearchResults && renderEntityList(renderPropArgs)}
                  </Fragment>
                )}
                {!!pageCount && (
                  <Paginator
                    className={styles.paginator}
                    page={paginator.getPage()}
                    pageCount={pageCount}
                    select={onSelect}
                  />
                )}
                {hasNoSearchResults && <NoSearchResultsAdvice />}
              </Fragment>
            )}
          </Workbench.Content>
        </Workbench>
      )}
    </Fragment>
  );
};

EntitiesView.propTypes = {
  entityType: PropTypes.oneOf(['asset', 'entry']).isRequired,
  title: PropTypes.string.isRequired,
  listViewContext: PropTypes.shape({
    getView: PropTypes.func.isRequired,
    setView: PropTypes.func.isRequired,
  }).isRequired,
  searchControllerProps: PropTypes.shape({
    keys: PropTypes.shape({
      search: PropTypes.arrayOf(PropTypes.string).isRequired,
      query: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
    getListQuery: PropTypes.func.isRequired,
    cache: PropTypes.shape({
      entry: PropTypes.object,
      asset: PropTypes.object,
    }),
  }).isRequired,
  fetchEntities: PropTypes.func.isRequired,
  renderAddEntityActions: PropTypes.func.isRequired,
  renderEmptyState: PropTypes.func.isRequired,
  renderEntityList: PropTypes.func.isRequired,
  renderSavedViewsActions: PropTypes.func.isRequired,
  renderTopContent: PropTypes.func.isRequired,
  environmentId: PropTypes.string.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
  space: PropTypes.object.isRequired,
};

EntitiesView.defaultProps = {
  renderSavedViewsActions: noop,
  renderTopContent: noop,
};
