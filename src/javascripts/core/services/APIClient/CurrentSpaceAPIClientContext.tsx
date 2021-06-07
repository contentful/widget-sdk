import * as React from 'react';
import { createAPIClient } from './utils';
import { useSpaceEnvContext } from '../SpaceEnvContext/useSpaceEnvContext';
import APIClient from 'data/APIClient';
import { getCMAClient, useSpaceEnvCMAClient } from '../usePlainCMAClient';
import { Source } from 'i13n/constants';

export type CurrentSpaceAPIClientContextProps = {
  client?: APIClient;
  customWidgetClient?: APIClient;
  plainClient?: ReturnType<typeof getCMAClient>;
  customWidgetPlainClient?: ReturnType<typeof getCMAClient>;
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

  // TODO: remove me once webapp uses experience SDK without feature flags
  const [customWidgetClient, setCustomWidgetClient] = React.useState(
    createAPIClient(currentSpaceId, resolvedEnvironmentId, Source.CustomWidget)
  );

  const { spaceEnvCMAClient: plainClient } = useSpaceEnvCMAClient({ noBatch: true });
  const { spaceEnvCMAClient: customWidgetPlainClient } = useSpaceEnvCMAClient({
    noBatch: true,
    source: Source.CustomWidget,
  });

  React.useEffect(() => {
    setClient(createAPIClient(currentSpaceId, resolvedEnvironmentId));
    setCustomWidgetClient(
      createAPIClient(currentSpaceId, resolvedEnvironmentId, Source.CustomWidget)
    );
  }, [currentSpaceId, resolvedEnvironmentId]);

  return (
    <CurrentSpaceAPIClientContext.Provider
      value={{ client, customWidgetClient, plainClient, customWidgetPlainClient }}>
      {props.children}
    </CurrentSpaceAPIClientContext.Provider>
  );
};
