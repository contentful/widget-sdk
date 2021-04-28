import * as React from 'react';
import { createAPIClient } from './utils';
import { useSpaceEnvContext } from '../SpaceEnvContext/useSpaceEnvContext';
import APIClient from 'data/APIClient';
import { Source } from 'i13n/constants';

export type CurrentSpaceAPIClientContextProps = {
  client?: APIClient;
  customWidgetClient?: APIClient;
};

export const CurrentSpaceAPIClientContext = React.createContext<CurrentSpaceAPIClientContextProps>(
  {}
);

export const CurrentSpaceAPIClientProvider: React.FC<{}> = (props) => {
  const { currentSpaceId, currentEnvironmentId, currentEnvironmentAliasId } = useSpaceEnvContext();
  const resolvedEnvironmentId = currentEnvironmentAliasId || currentEnvironmentId;

  const [client, setClient] = React.useState(
    createAPIClient(currentSpaceId, resolvedEnvironmentId)
  );
  const [customWidgetClient, setCustomWidgetClient] = React.useState(
    createAPIClient(currentSpaceId, resolvedEnvironmentId, Source.CustomWidget)
  );

  React.useEffect(() => {
    setClient(createAPIClient(currentSpaceId, resolvedEnvironmentId));
    setCustomWidgetClient(
      createAPIClient(currentSpaceId, resolvedEnvironmentId, Source.CustomWidget)
    );
  }, [currentSpaceId, resolvedEnvironmentId]);

  return (
    <CurrentSpaceAPIClientContext.Provider value={{ client, customWidgetClient }}>
      {props.children}
    </CurrentSpaceAPIClientContext.Provider>
  );
};
