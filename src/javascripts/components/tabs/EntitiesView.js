import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Workbench, Spinner } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle';
import NavigationIcon from 'ui/Components/NavigationIcon';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import Search from 'app/ContentList/Search/View';
import SavedViewsSidebar from 'app/ContentList/SavedViews/Sidebar';
import { css } from 'emotion';
import useSearchController from 'app/ContentList/Search/useSearchController';
import usePaginator from 'app/ContentList/Search/usePaginator';
import { Paginator } from 'core/components/Paginator';
import RecordsResourceUsage from 'components/RecordsResourceUsage';
import * as ResourceUtils from 'utils/ResourceUtils';
import PluralizeEntityMessage from './PluralizeEntityMessage';
import tokens from '@contentful/forma-36-tokens';
import { noop } from 'lodash';
import NoSearchResultsAdvice from 'components/tabs/NoSearchResultsAdvice';
import UpgradeBanner from './UpgradeBanner';

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

const EntitiesView = ({
  entityType,
  fetchEntities,
  listViewContext,
  renderAddEntityActions,
  renderEmptyState,
  renderEntityList,
  renderSavedViewsActions,
  renderTopContent,
  searchControllerProps,
  getContentTypes,
  spaceContext,
  title,
  cache,
}) => {
  const paginator = usePaginator();
  const [isInitialized, setIsInitialized] = useState(false);
  const [users, setUsers] = useState([]);

  const [
    { isLoading, entities, hasEntities, hasNoSearchResults, showNoEntitiesAdvice },
    { updateEntities },
  ] = useSearchController({
    cache,
    listViewContext,
    paginator,
    fetchEntities,
    getListQuery: searchControllerProps.getListQuery,
    keys: {
      search: searchControllerProps.searchKeys,
      query: searchControllerProps.queryKeys,
    },
  });

  useEffect(() => {
    const init = async () => {
      const users = await spaceContext.users.getAll();
      setUsers(users);
      !isLoading && setIsInitialized(true);
    };
    init();
  }, [spaceContext, isLoading]);

  const pageCount = paginator.getPageCount();
  const isLegacyOrganization = ResourceUtils.isLegacyOrganization(spaceContext.organization);
  const environmentId = spaceContext.getEnvironmentId();
  const isMasterEnvironment = spaceContext.isMasterEnvironment();
  const space = spaceContext.space.data;

  const renderPropArgs = {
    entities,
    isLoading,
    updateEntities,
    showNoEntitiesAdvice,
  };

  const onSelect = (page = 0) => {
    paginator.setPage(page);
    updateEntities();
  };

  const onSelectSavedView = () => onSelect();

  return (
    <Fragment>
      <DocumentTitle title={title} />
      {!isInitialized ? (
        <Workbench className={styles.flex}>
          <div className={styles.loader} data-test-id="loading-spinner">
            <Spinner size="large" className={styles.spinner} />
            <div className={styles.spinnerText}>Loading {title.toLowerCase()}...</div>
          </div>
        </Workbench>
      ) : (
        <Workbench testId={`${entityType}-view`}>
          <Workbench.Header
            title={title}
            description={<KnowledgeBase target={entityType} className={styles.info} />}
            icon={<NavigationIcon icon={title.toLowerCase()} size="large" color="green" />}
            actions={
              <div className={styles.header}>
                <Search
                  className={styles.search}
                  entityType={entityType}
                  isLoading={isLoading}
                  listViewContext={listViewContext}
                  onUpdate={() => updateEntities()}
                  getContentTypes={getContentTypes}
                  users={users}
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
                <UpgradeBanner
                  space={space}
                  environmentId={environmentId}
                  isMasterEnvironment={isMasterEnvironment}
                />
                {hasEntities && (
                  <Fragment>
                    <PluralizeEntityMessage
                      className={styles.searchResults}
                      entityType={entityType}
                      count={paginator.getTotal()}
                      restOfTheMsg="found"
                    />
                    {!isLegacyOrganization && (
                      <RecordsResourceUsage
                        className={styles.usageResults}
                        space={space}
                        environmentId={environmentId}
                        isMasterEnvironment={isMasterEnvironment}
                      />
                    )}
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
  cache: PropTypes.shape({
    entry: PropTypes.object,
    asset: PropTypes.object,
  }),
  searchControllerProps: PropTypes.shape({
    searchKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
    queryKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
    getListQuery: PropTypes.func.isRequired,
  }).isRequired,
  fetchEntities: PropTypes.func.isRequired,
  renderAddEntityActions: PropTypes.func.isRequired,
  renderEmptyState: PropTypes.func.isRequired,
  renderEntityList: PropTypes.func.isRequired,
  renderSavedViewsActions: PropTypes.func.isRequired,
  renderTopContent: PropTypes.func.isRequired,
  getContentTypes: PropTypes.func.isRequired,
  spaceContext: PropTypes.object.isRequired,
};

EntitiesView.defaultProps = {
  renderSavedViewsActions: noop,
  renderTopContent: noop,
};

export default EntitiesView;
