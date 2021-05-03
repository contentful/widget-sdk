import * as React from 'react';
import { createAPIClient } from './utils';
import { useSpaceEnvContext } from '../SpaceEnvContext/useSpaceEnvContext';
import APIClient from 'data/APIClient';
import { getCMAClient, useSpaceEnvCMAClient } from '../usePlainCMAClient/usePlainCMAClient';
import { Source } from 'i13n/constants';

export type CurrentSpaceAPIClientContextProps = {
  client?: APIClient;
  customWidgetClient?: APIClient;
  plainClient?: ReturnType<typeof getCMAClient>;
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

  const { spaceEnvCMAClient: plainClient } = useSpaceEnvCMAClient({ noBatch: true });

  React.useEffect(() => {
    setClient(createAPIClient(currentSpaceId, resolvedEnvironmentId));
    setCustomWidgetClient(
      createAPIClient(currentSpaceId, resolvedEnvironmentId, Source.CustomWidget)
    );
  }, [currentSpaceId, resolvedEnvironmentId]);

  return (
    <CurrentSpaceAPIClientContext.Provider value={{ client, customWidgetClient, plainClient }}>
      {props.children}
    </CurrentSpaceAPIClientContext.Provider>
  );
};
