import React, { useCallback, Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import EntryList from './EntryList';
import * as ListQuery from 'search/listQuery';
import { Action, canPerformActionOnEntryOfType } from 'access_control/AccessChecker';
import * as Analytics from 'analytics/Analytics';
import * as entityCreator from 'components/app_container/entityCreator';
import { get } from 'lodash';
import EntitiesView from '../EntitiesView';
import CreateEntryButton from 'components/CreateEntryButton/CreateEntryButton';
import { ScheduledActionsPageLink } from 'app/ScheduledActions';
import ReleasesPageLink from 'app/Releases/ReleasesPage/ReleasesPageLink';
import EmptyStates from './EmptyStates';
import EntityListCache from 'classes/entityListCache';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import useListView from 'app/ContentList/Search/useListView';
import * as K from 'core/utils/kefir';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import { getModule } from 'core/NgRegistry';

const trackEnforcedButtonClick = (err) => {
  // If we get reason(s), that means an enforcement is present
  const reason = get(err, 'body.details.reasons', null);

  Analytics.track('entity_button:click', {
    entityType: 'entry',
    enforced: Boolean(reason),
    reason,
  });
};

const newEntry = (goTo, spaceContext, showNoEntitiesAdvice) => async (contentTypeId) => {
  try {
    const entry = await entityCreator.newEntry(contentTypeId);
    const { data } = spaceContext.publishedCTs.get(contentTypeId);
    const eventOriginFlag = showNoEntitiesAdvice ? '--empty' : '';

    Analytics.track('entry:create', {
      eventOrigin: `content-list${eventOriginFlag}`,
      contentType: data,
      response: entry.data,
    });

    goTo(entry.getId());
  } catch (err) {
    // Throw err so the UI can also display it
    trackEnforcedButtonClick(err);
    throw err;
  }
};

const Entries = ({ goTo }) => {
  const entityType = 'entry';
  const spaceContext = useMemo(() => getModule('spaceContext'), []);
  const listViewContext = useListView({
    entityType,
    isPersisted: true,
  });
  const fetchEntries = useCallback((query) => spaceContext.space.getEntries(query), [spaceContext]);
  const [jobs, setJobs] = useState([]);
  const [hasContentType, setHasContentType] = useState(false);
  const [accessibleCTs, setAccessibleCTs] = useState([]);

  const { contentTypeId } = listViewContext.getView();

  const cache = useMemo(
    () => ({
      entry: new EntityListCache({
        space: spaceContext.space,
        entityType: 'Entry',
        limit: 5,
      }),
      asset: new EntityListCache({
        space: spaceContext.space,
        entityType: 'Asset',
        limit: 3,
      }),
    }),
    [spaceContext]
  );

  const updateAccessibleCTs = useCallback(() => {
    const accessibleCTs = spaceContext.publishedCTs
      .getAllBare()
      .filter((ct) => canPerformActionOnEntryOfType(Action.CREATE, ct.sys.id));
    setAccessibleCTs(accessibleCTs);
  }, [spaceContext]);

  useEffect(() => {
    updateAccessibleCTs();
  }, [updateAccessibleCTs]);

  useEffect(() => {
    const init = async () => {
      try {
        const spaceEndpoint = createSpaceEndpoint(
          spaceContext.space.data.sys.id,
          spaceContext.space.environment.sys.id
        );
        const { items = [] } = await ScheduledActionsService.getJobs(spaceEndpoint, {
          order: 'scheduledFor.datetime',
          'sys.status': 'scheduled',
          'environment.sys.id': spaceContext.space.environment.sys.id,
        });
        setJobs(items);
        updateAccessibleCTs();
      } catch (error) {
        // ignore error
      }
    };
    init();
  }, [spaceContext, updateAccessibleCTs]);

  useEffect(() => {
    K.onValue(spaceContext.publishedCTs.items$, (cts) => {
      setHasContentType(cts.length > 0);
      updateAccessibleCTs();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isMasterEnvironment = spaceContext.isMasterEnvironment();

  const displayFieldForFilteredContentType = () =>
    EntityFieldValueSpaceContext.displayFieldForType(contentTypeId);

  return (
    <EntitiesView
      title="Content"
      cache={cache}
      listViewContext={listViewContext}
      entityType={entityType}
      spaceContext={spaceContext}
      fetchEntities={fetchEntries}
      getContentTypes={() => accessibleCTs}
      searchControllerProps={{
        searchKeys: ['searchText', 'searchFilters', 'contentTypeId', 'id'],
        queryKeys: ['searchText', 'searchFilters', 'contentTypeId'],
        getListQuery: ListQuery.getForEntries,
      }}
      renderAddEntityActions={({ showNoEntitiesAdvice }, className) => (
        <span className={className}>
          <CreateEntryButton
            contentTypes={accessibleCTs}
            suggestedContentTypeId={contentTypeId}
            onSelect={newEntry(goTo, spaceContext, showNoEntitiesAdvice, contentTypeId)}
          />
        </span>
      )}
      renderSavedViewsActions={() => (
        <Fragment>
          <ScheduledActionsPageLink isMasterEnvironment={isMasterEnvironment} />
          <ReleasesPageLink isMasterEnvironment={isMasterEnvironment} />
        </Fragment>
      )}
      renderEmptyState={({ showNoEntitiesAdvice }, className) => (
        <EmptyStates
          className={className}
          hasContentType={hasContentType}
          contentTypes={accessibleCTs}
          suggestedContentTypeId={contentTypeId}
          onCreate={newEntry(goTo, spaceContext, showNoEntitiesAdvice)}
        />
      )}
      renderEntityList={({ entities, isLoading, updateEntities }, className) => (
        <EntryList
          className={className}
          entries={entities}
          displayFieldForFilteredContentType={displayFieldForFilteredContentType}
          listViewContext={listViewContext}
          jobs={jobs}
          entryCache={cache.entry}
          assetCache={cache.asset}
          isLoading={isLoading}
          updateEntries={() => updateEntities()}
        />
      )}
    />
  );
};

Entries.propTypes = {
  goTo: PropTypes.func.isRequired,
};

export default Entries;
