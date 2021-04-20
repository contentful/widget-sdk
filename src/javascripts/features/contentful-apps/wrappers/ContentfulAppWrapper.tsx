import { ReactElement } from 'react';

import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { useContentfulAppsConfig } from '../hooks/useContentfulAppConfig';

interface IfAppInstalledProps {
  appId: 'launch' | 'compose';
  children: ReactElement;
}

export const IfAppInstalled: React.FC<IfAppInstalledProps> = ({
  appId,
  children,
}: IfAppInstalledProps): ReactElement | null => {
  const { currentSpaceId, currentEnvironmentId, currentOrganizationId } = useSpaceEnvContext();

  const app = useContentfulAppsConfig({
    appId,
    organizationId: currentOrganizationId,
    spaceId: currentSpaceId,
    environmentId: currentEnvironmentId,
  });

  if (!app.isPurchased || !app.isInstalled) {
    return null;
  }

  return children;
};
