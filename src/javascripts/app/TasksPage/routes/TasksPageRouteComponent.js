import React from 'react';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getSpaceMember, isMasterEnvironmentById } from 'core/services/SpaceEnvContext/utils';
import TheLocaleStore from 'services/localeStore';
import TasksPage from './..';

const RouteComponent = () => {
  const {
    currentSpaceId: spaceId,
    currentEnvironmentId: environmentId,
    currentSpace,
    currentUsers: users,
    currentSpaceEnvironments,
    currentSpaceContentTypes,
  } = useSpaceEnvContext();
  const currentUserId = getSpaceMember(currentSpace).sys.user.sys.id;
  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;
  const getContentType = (contentTypeId) =>
    currentSpaceContentTypes.find((ct) => ct.sys.id === contentTypeId);

  return (
    <TasksPage
      spaceId={spaceId}
      environmentId={environmentId}
      currentUserId={currentUserId}
      isMasterEnvironmentById={(environmentId) =>
        isMasterEnvironmentById(currentSpaceEnvironments, environmentId)
      }
      users={users}
      defaultLocaleCode={defaultLocaleCode}
      getContentType={getContentType}
    />
  );
};

export default RouteComponent;
