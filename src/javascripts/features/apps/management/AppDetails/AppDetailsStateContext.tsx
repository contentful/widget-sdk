import React, { ReactElement } from 'react';
import { AppDefinitionWithBundle } from '../AppEditor/AppHosting';
import { ManagementApiClient } from '../ManagementApiClient';
import { ValidationError } from '../AppEditor';
import { HostingStateContext } from './HostingStateProvider';

export const ERROR_PATH_DEFINITION = ['definition'];
export const ERROR_PATH_EVENTS = ['events'];

interface Event {
  enabled: boolean;
  targetUrl: string;
  topics: unknown[];
}

interface AppDetailsStateContextValue {
  draftDefinition: AppDefinitionWithBundle;
  setDraftDefinition: (definition: AppDefinitionWithBundle) => void;
  setDraftEvents: (event: Event) => void;
  saveEvents: () => Promise<Event>;
  saveDefinition: () => Promise<AppDefinitionWithBundle>;
  savedDefinition: AppDefinitionWithBundle;
  setSavedDefinition: (definition: AppDefinitionWithBundle) => void;
  draftEvents: Event;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const AppDetailsStateContext = React.createContext<AppDetailsStateContextValue>(null!);

export interface AppDetailsStateProviderProps {
  definition: AppDefinitionWithBundle;
  savedDefinition?: AppDefinitionWithBundle;
  events?: Event;
  children: ReactElement;
}

export const AppDetailsStateProvider = (props: AppDetailsStateProviderProps) => {
  const [draftDefinition, setDraftDefinition] = React.useState(props.definition);
  const [draftEvents, setDraftEvents] = React.useState(
    props.events || { enabled: false, targetUrl: '', topics: [] }
  );
  const [savedDefinition, setSavedDefinition] = React.useState(
    props.savedDefinition || props.definition
  );

  const context = React.useContext(HostingStateContext);

  const saveEvents = async () => {
    if (!props.events) {
      return;
    }
    try {
      if (draftEvents.enabled) {
        const { targetUrl, topics } = await ManagementApiClient.updateAppEvents(
          props.definition.sys.organization.sys.id,
          props.definition.sys.id,
          {
            targetUrl: draftEvents.targetUrl,
            topics: draftEvents.topics,
          }
        );
        return { enabled: true, targetUrl, topics };
      } else {
        if (props.events.enabled) {
          await ManagementApiClient.deleteAppEvents(
            props.definition.sys.organization.sys.id,
            props.definition.sys.id
          );
        }
        return { enabled: false, targetUrl: '', topics: [] };
      }
    } catch (err) {
      if (err.status === 422) {
        return err.data.details.errors.forEeach((error: ValidationError) => {
          error.path = [...ERROR_PATH_EVENTS, ...error.path];
        });
      }

      throw err;
    }
  };

  const saveDefinition = async () => {
    try {
      const response = await ManagementApiClient.save({
        ...draftDefinition,
        // save only what has been selected as switch option
        bundle: context.isAppHosting ? draftDefinition.bundle : undefined,
        src: !context.isAppHosting ? draftDefinition.src : undefined,
      });
      return response;
    } catch (err) {
      if (err.status === 422) {
        err.data.details.errors.forEeach((error: ValidationError) => {
          if (error.path[0] === 'locations' && typeof error.path[1] === 'number') {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            error.path[1] = props.definition.locations![error.path[1]].location;
          }

          error.path = [...ERROR_PATH_DEFINITION, ...error.path];
        });
      }

      throw err;
    }
  };

  return (
    <AppDetailsStateContext.Provider
      value={{
        draftDefinition,
        draftEvents,
        setDraftEvents,
        savedDefinition,
        setSavedDefinition,
        setDraftDefinition,
        saveEvents,
        saveDefinition,
      }}>
      {props.children}
    </AppDetailsStateContext.Provider>
  );
};
