import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getModule } from 'core/NgRegistry';
import { TASKS_DASHBOARD, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(TASKS_DASHBOARD);

export async function getOpenAssignedTasksAndEntries(spaceId, envId, userId) {
  const spaceContext = getModule('spaceContext');
  const { items: tasks } = await getOpenAssignedTasks(spaceId, envId, userId);
  const { items: entries } = await spaceContext.cma.getEntries({
    'sys.id[in]': tasks.map((task) => task.sys.parentEntity.sys.id).join(','),
  });
  return [tasks, entries];
}

async function getOpenAssignedTasks(spaceId, envId, userId) {
  const endpoint = createSpaceEndpoint(spaceId, envId);
  return endpoint(
    {
      method: 'GET',
      path: ['tasks'],
      query: { 'assignedTo.sys.id': userId },
    },
    alphaHeader
  );
}
