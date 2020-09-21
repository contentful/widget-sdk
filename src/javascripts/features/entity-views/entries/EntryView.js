import React, { useCallback, Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { EntryList } from './EntryList';
import { useListView } from 'features/entity-search';
import { ListQuery } from 'core/services/ContentQuery';
import { Action, canPerformActionOnEntryOfType } from 'access_control/AccessChecker';
import * as Analytics from 'analytics/Analytics';
import * as entityCreator from 'components/app_container/entityCreator';
import { get } from 'lodash';
import { EntitiesView } from '../core/EntitiesView';
import CreateEntryButton from 'components/CreateEntryButton/CreateEntryButton';
import { ScheduledActionsPageLink } from 'app/ScheduledActions';
import ReleasesPageLink from 'app/Releases/ReleasesPage/ReleasesPageLink';
import { EmptyStates } from './EmptyStates';

import EntityListCache from 'classes/entityListCache';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import * as K from 'core/utils/kefir';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import { getModule } from 'core/NgRegistry';
import getAccessibleCTs from 'data/ContentTypeRepo/accessibleCTs';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';

const trackEnforcedButtonClick = (err) => {
  // If we get reason(s), that means an enforcement is present
  const reason = get(err, 'body.details.reasons', null);

  Analytics.track('entity_button:click', {
    entityType: 'entry',
    enforced: Boolean(reason),
    reason,
  });
};

const newEntry = (goTo, publishedCTs, showNoEntitiesAdvice) => async (contentTypeId) => {
  try {
    const entry = await entityCreator.newEntry(contentTypeId);
    const { data } = publishedCTs.get(contentTypeId);
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

export const EntryView = ({ goTo }) => {
  const entityType = 'entry';
  const spaceContext = useMemo(() => getModule('spaceContext'), []);
  const {
    currentEnvironmentId,
    currentOrganization,
    currentSpace,
    currentSpaceData,
    currentSpaceId,
  } = useSpaceEnvContext();
  const listViewContext = useListView({
    entityType,
    isPersisted: true,
    onUpdate,
  });
  const fetchEntries = useCallback((query) => currentSpace.getEntries(query), [currentSpace]);
  const [jobs, setJobs] = useState([]);
  const [hasContentType, setHasContentType] = useState(false);
  const [accessibleCTs, setAccessibleCTs] = useState([]);

  const { contentTypeId } = listViewContext.getView();
  const [suggestedContentTypeId, setSuggestedContentTypeId] = useState(contentTypeId);

  const cache = useMemo(
    () => ({
      entry: new EntityListCache({
        space: currentSpace,
        entityType: 'Entry',
        limit: 5,
      }),
      asset: new EntityListCache({
        space: currentSpace,
        entityType: 'Asset',
        limit: 3,
      }),
    }),
    [currentSpace]
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
        const spaceEndpoint = createSpaceEndpoint(currentSpaceId, currentEnvironmentId);
        const { items = [] } = await ScheduledActionsService.getJobs(spaceEndpoint, {
          order: 'scheduledFor.datetime',
          'sys.status': 'scheduled',
          'environment.sys.id': currentEnvironmentId,
        });
        setJobs(items);
        updateAccessibleCTs();
      } catch (error) {
        // ignore error
      }
    };
    init();
  }, [currentSpaceId, currentEnvironmentId, updateAccessibleCTs]);

  useEffect(() => {
    return K.onValue(spaceContext.publishedCTs.items$, (cts) => {
      setHasContentType(cts.length > 0);
      updateAccessibleCTs();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);

  const displayFieldForFilteredContentType = () =>
    EntityFieldValueSpaceContext.displayFieldForType(contentTypeId);

  function onUpdate({ contentTypeId }) {
    setSuggestedContentTypeId(contentTypeId);
  }

  return (
    <EntitiesView
      title="Content"
      cache={cache}
      listViewContext={listViewContext}
      entityType={entityType}
      environmentId={currentEnvironmentId}
      spaceId={currentSpaceId}
      space={currentSpaceData}
      organization={currentOrganization}
      isMasterEnvironment={isMasterEnvironment}
      fetchEntities={fetchEntries}
      getContentTypes={() => getAccessibleCTs(spaceContext.publishedCTs, contentTypeId)}
      searchControllerProps={{
        searchKeys: ['searchText', 'searchFilters', 'contentTypeId', 'id'],
        queryKeys: ['searchText', 'searchFilters', 'contentTypeId'],
        getListQuery: ListQuery.getForEntries,
      }}
      renderAddEntityActions={({ showNoEntitiesAdvice }, className) => (
        <span className={className}>
          <CreateEntryButton
            contentTypes={accessibleCTs}
            suggestedContentTypeId={suggestedContentTypeId}
            onSelect={newEntry(
              goTo,
              spaceContext.publishedCTs,
              showNoEntitiesAdvice,
              contentTypeId
            )}
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
          onCreate={newEntry(goTo, spaceContext.publishedCTs, showNoEntitiesAdvice)}
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

EntryView.propTypes = {
  goTo: PropTypes.func.isRequired,
};
