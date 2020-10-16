import React, { useCallback, Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { EntryList } from './EntryList';
import { useListView } from 'features/entity-search';
import { ListQuery } from 'core/services/ContentQuery';
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
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
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
    const contentType = publishedCTs.find((ct) => ct.sys.id === contentTypeId);
    const eventOriginFlag = showNoEntitiesAdvice ? '--empty' : '';

    Analytics.track('entry:create', {
      eventOrigin: `content-list${eventOriginFlag}`,
      contentType,
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

  const [suggestedContentTypeId, setSuggestedContentTypeId] = useState(
    listViewContext.getView().contentTypeId
  );

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
      } catch (error) {
        // ignore error
      }
    };
    init();
  }, [currentSpaceId, currentEnvironmentId]);

  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);

  function onUpdate({ contentTypeId }) {
    setSuggestedContentTypeId(contentTypeId);
  }

  const searchControllerProps = useMemo(
    () => ({
      cache: {
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
      },
      keys: {
        search: ['searchText', 'searchFilters', 'contentTypeId', 'id'],
        query: ['searchText', 'searchFilters', 'contentTypeId'],
      },
      getListQuery: ListQuery.getForEntries,
    }),
    [currentSpace]
  );

  return (
    <EntitiesView
      title="Content"
      listViewContext={listViewContext}
      entityType={entityType}
      environmentId={currentEnvironmentId}
      space={currentSpaceData}
      organization={currentOrganization}
      isMasterEnvironment={isMasterEnvironment}
      fetchEntities={fetchEntries}
      searchControllerProps={searchControllerProps}
      renderAddEntityActions={(
        { showNoEntitiesAdvice, contentTypes, creatableContentTypes },
        className
      ) => (
        <span className={className}>
          <CreateEntryButton
            contentTypes={creatableContentTypes}
            suggestedContentTypeId={suggestedContentTypeId}
            onSelect={newEntry(goTo, contentTypes, showNoEntitiesAdvice)}
          />
        </span>
      )}
      renderSavedViewsActions={() => (
        <Fragment>
          <ScheduledActionsPageLink isMasterEnvironment={isMasterEnvironment} />
          <ReleasesPageLink isMasterEnvironment={isMasterEnvironment} />
        </Fragment>
      )}
      renderEmptyState={(
        { showNoEntitiesAdvice, contentTypes, creatableContentTypes },
        className
      ) => (
        <EmptyStates
          className={className}
          hasContentType={contentTypes.length > 0}
          contentTypes={creatableContentTypes}
          suggestedContentTypeId={suggestedContentTypeId}
          onCreate={newEntry(goTo, contentTypes, showNoEntitiesAdvice)}
        />
      )}
      renderEntityList={({ entities, isLoading, updateEntities }, className) => (
        <EntryList
          className={className}
          entries={entities}
          listViewContext={listViewContext}
          jobs={jobs}
          searchControllerProps={searchControllerProps}
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
