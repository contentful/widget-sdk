import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getModule } from 'NgRegistry';
import { COMMENTS_API, TASKS_DASHBOARD, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(COMMENTS_API, TASKS_DASHBOARD);

async function getOpenAssignedTasks(spaceId, userId) {
  const { items } = await createSpaceEndpoint(spaceId)(
    {
      method: 'GET',
      path: ['tasks'],
      query: { 'assignedTo.sys.id': userId }
    },
    alphaHeader
  );
  return items;
}

export async function getOpenAssignedTasksAndEntries(spaceId, userId) {
  const spaceContext = getModule('spaceContext');
  const tasks = await getOpenAssignedTasks(spaceId, userId);
  const { items: entries } = await spaceContext.cma.getEntries({
    'sys.id[in]': tasks.map(item => item.sys.reference.sys.id).join(',')
  });
  return [tasks, entries];
}
