import React from 'react';
import { useSpaceEnvContext, useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { getSpaceMember } from 'core/services/SpaceEnvContext/utils';
import TheLocaleStore from 'services/localeStore';
import { TasksPage } from './TasksPage';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

const TasksPageRoute = () => {
  const {
    currentSpaceId: spaceId,
    currentEnvironmentId: environmentId,
    currentSpace,
  } = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const currentUserId = getSpaceMember(currentSpace)?.sys.user.sys.id;
  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;
  const getContentType = (contentTypeId: string) =>
    currentSpaceContentTypes.find((ct) => ct.sys.id === contentTypeId);

  return (
    <TasksPage
      spaceId={spaceId}
      environmentId={environmentId}
      currentUserId={currentUserId}
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
          <Route path="/" name="spaces.detail.tasks" element={<TasksPageRoute />} />
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