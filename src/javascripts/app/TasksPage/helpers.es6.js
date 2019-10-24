import { createSpaceEndpoint } from 'data/EndpointFactory.es6';

export async function getOpenAssignedTasks(spaceId, userId) {
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
