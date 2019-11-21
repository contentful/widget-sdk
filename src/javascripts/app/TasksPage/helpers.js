import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getModule } from 'NgRegistry';
import { COMMENTS_API, TASKS_DASHBOARD, getAlphaHeader } from 'alphaHeaders.js';
import { transformTaskArray } from 'data/CMA/TasksRepo';

const alphaHeader = getAlphaHeader(COMMENTS_API, TASKS_DASHBOARD);

export async function getOpenAssignedTasksAndEntries(spaceId, envId, userId) {
  const spaceContext = getModule('spaceContext');
  const tasks = await getOpenAssignedTasks(spaceId, envId, userId);
  const { items: entries } = await spaceContext.cma.getEntries({
    'sys.id[in]': tasks.map(task => task.sys.parentEntity.sys.id).join(',')
  });
  return [tasks, entries];
}

async function getOpenAssignedTasks(spaceId, envId, userId) {
  const endpoint = createSpaceEndpoint(spaceId, envId);
  const data = await endpoint(
    {
      method: 'GET',
      path: ['tasks'],
      query: { 'assignedTo.sys.id': userId }
    },
    alphaHeader
  );
  return transformTaskArray(data);
}
