import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getModule } from 'NgRegistry';
import { COMMENTS_API, TASKS_DASHBOARD, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(COMMENTS_API, TASKS_DASHBOARD);

export async function getOpenAssignedTasksAndEntries(spaceId, envId, userId) {
  const spaceContext = getModule('spaceContext');
  const tasks = await getOpenAssignedTasks(spaceId, envId, userId);
  const { items: entries } = await spaceContext.cma.getEntries({
    'sys.id[in]': tasks.map(task => task.sys.parentEntity.sys.id).join(',')
  });
  return [tasks, entries];
}

export function getTasksFromResponse({ headers, data: { items } }) {
  if (headers['x-contentful-tasks-version'] !== 'pre-preview') {
    return items.map(transformTask);
  } else {
    return items;
  }
}

export function transformTask(task) {
  Object.assign(task, task.assignment);
  delete task.assignment;

  Object.assign(task.sys, { parentEntity: task.sys.reference });
  delete task.sys.commentType;
  delete task.sys.reference;

  return task;
}

async function getOpenAssignedTasks(spaceId, envId, userId) {
  const endpoint = createSpaceEndpoint(spaceId, envId, { includeHeaders: true });
  const res = await endpoint(
    {
      method: 'GET',
      path: ['tasks'],
      query: { 'assignedTo.sys.id': userId }
    },
    { 'x-contentful-enable-alpha-feature': 'comments-api,tasks-dashboard' }
  );
  return getTasksFromResponse(res);
}
