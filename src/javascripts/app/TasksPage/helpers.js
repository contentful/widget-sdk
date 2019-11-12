import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getModule } from 'NgRegistry';
import { COMMENTS_API, TASKS_DASHBOARD, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(COMMENTS_API, TASKS_DASHBOARD);

async function getOpenAssignedTasks(spaceId, userId) {
  const endpoint = createSpaceEndpoint(spaceId, undefined, { includeHeaders: true });
  const {
    headers,
    data: { items }
  } = await endpoint(
    {
      method: 'GET',
      path: ['tasks'],
      query: { 'assignedTo.sys.id': userId }
    },
    alphaHeader
  );
  if (headers['x-contentful-tasks-version'] === 'pre-preview') {
    return transformTasks(items);
  } else {
    return items;
  }
}

export async function getOpenAssignedTasksAndEntries(spaceId, userId) {
  const spaceContext = getModule('spaceContext');
  const tasks = await getOpenAssignedTasks(spaceId, userId);
  const { items: entries } = await spaceContext.cma.getEntries({
    'sys.id[in]': tasks.map(task => task.sys.parentEntity.sys.id).join(',')
  });
  return [tasks, entries];
}

function transformTasks(tasks) {
  return tasks.map(task => {
    Object.assign(task, task.assignment);
    delete task.assignment;

    Object.assign(task.sys, { parentEntity: task.sys.reference });
    delete task.sys.commentType;
    delete task.sys.reference;

    return task;
  });
}
