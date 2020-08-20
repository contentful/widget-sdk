import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { getEntityTitle } from 'app/entry_editor/EntryReferences/referencesService';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes';
import { ScheduleWidget } from './ScheduleWidget';
import { ScheduledActionsContextProvider } from './ScheduledActionsContext';

const ScheduleWidgetContainer = ({ emitter }) => {
  const [entityState, setEntityState] = useState({
    entityInfo: undefined,
    entity: undefined,
    entityTitle: undefined,
    isMasterEnvironment: false,
    readOnlyScheduledActions: false,
    spaceId: undefined,
    validator: undefined,
    environmentId: undefined,
  });

  useEffect(() => {
    const onWidgetUpdate = async ({ entity, ...otherUpdates }) => {
      const entityTitle = await getEntityTitle(entity);
      setEntityState({
        entity,
        entityTitle,
        ...otherUpdates,
      });
    };

    emitter.on(SidebarEventTypes.UPDATED_SCHEDULE_WIDGET, onWidgetUpdate);
    emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.SCHEDULE);

    return () => {
      emitter.off(SidebarEventTypes.UPDATED_SCHEDULE_WIDGET, onWidgetUpdate);
    };
  }, [emitter]);

  if (!entityState.entityInfo) {
    return null;
  }

  return (
    <ScheduledActionsContextProvider
      spaceId={entityState.spaceId}
      environmentId={entityState.environmentId}
      isMasterEnvironment={entityState.isMasterEnvironment}>
      <ScheduleWidget emitter={emitter} {...entityState} />
    </ScheduledActionsContextProvider>
  );
};

ScheduleWidgetContainer.propTypes = {
  emitter: PropTypes.object.isRequired,
};

export default ScheduleWidgetContainer;
