import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getModule } from 'NgRegistry';

async function getOpenAssignedTasks(spaceId, userId) {
  const { items } = await createSpaceEndpoint(spaceId)(
    {
      method: 'GET',
      path: ['tasks'],
      query: { 'assignedTo.sys.id': userId }
    },
    { 'x-contentful-enable-alpha-feature': 'comments-api,tasks-dashboard' }
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
