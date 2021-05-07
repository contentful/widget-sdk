import React from 'react';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getSpaceMember, isMasterEnvironmentById } from 'core/services/SpaceEnvContext/utils';
import TheLocaleStore from 'services/localeStore';
import { TasksPage } from './TasksPage';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { Environment } from 'core/services/SpaceEnvContext/types';

const TasksPageRoute = () => {
  const {
    currentSpaceId: spaceId,
    currentEnvironmentId: environmentId,
    currentSpace,
    currentUsers: users,
    currentSpaceEnvironments,
    currentSpaceContentTypes,
  } = useSpaceEnvContext();
  const currentUserId = getSpaceMember(currentSpace)?.sys.user.sys.id;
  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;
  const getContentType = (contentTypeId: string) =>
    currentSpaceContentTypes.find((ct) => ct.sys.id === contentTypeId);

  return (
    <TasksPage
      spaceId={spaceId}
      environmentId={environmentId}
      currentUserId={currentUserId}
      isMasterEnvironmentById={(environmentId: string) =>
        isMasterEnvironmentById(currentSpaceEnvironments as Environment[], environmentId)
      }
      users={users}
      defaultLocaleCode={defaultLocaleCode}
      getContentType={getContentType}
    />
  );
};

const TasksPageRouter = () => {
  const [basename] = window.location.pathname.split('tasks');

  return (
    <CustomRouter splitter="/tasks">
      <RouteErrorBoundary>
        <Routes basename={basename + 'tasks'}>
          <Route name="spaces.detail.tasks" element={<TasksPageRoute />} />
          <Route name={null} element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

const tasksRouteState = {
  name: 'tasks',
  url: '/tasks{pathname:any}',
  params: {
    navigationState: null,
  },
  component: TasksPageRouter,
};

export { tasksRouteState };
