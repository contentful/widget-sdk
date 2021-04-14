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
  const { currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  const [client, setClient] = React.useState(createAPIClient(currentSpaceId, currentEnvironmentId));
  const [customWidgetClient, setCustomWidgetClient] = React.useState(
    createAPIClient(currentSpaceId, currentEnvironmentId, Source.Widget)
  );

  React.useEffect(() => {
    setClient(createAPIClient(currentSpaceId, currentEnvironmentId));
    setCustomWidgetClient(createAPIClient(currentSpaceId, currentEnvironmentId, Source.Widget));
  }, [currentSpaceId, currentEnvironmentId]);

  return (
    <CurrentSpaceAPIClientContext.Provider value={{ client, customWidgetClient }}>
      {props.children}
    </CurrentSpaceAPIClientContext.Provider>
  );
};
