import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getSpaceContext } from 'classes/spaceContext';
import { TASKS_DASHBOARD, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(TASKS_DASHBOARD);

export async function getOpenAssignedTasksAndEntries(spaceId, envId, userId) {
  const spaceContext = getSpaceContext();
  const { items: tasks } = await getOpenAssignedTasks(spaceId, envId, userId);
  const entryIds = new Set(tasks.map((task) => task.sys.parentEntity.sys.id));
  let entries = [];
  if (entryIds.size) {
    ({ items: entries } = await spaceContext.cma.getEntries({
      'sys.id[in]': [...entryIds].join(','),
    }));
  }
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