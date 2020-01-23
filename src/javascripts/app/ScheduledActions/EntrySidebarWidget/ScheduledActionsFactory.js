export function create({ environmentId, entityId, action, scheduledAt }) {
  return {
    entity: {
      sys: {
        type: 'Link',
        linkType: 'Entry',
        id: entityId
      }
    },
    environment: {
      sys: {
        type: 'Link',
        linkType: 'Environment',
        id: environmentId
      }
    },
    scheduledFor: {
      datetime: scheduledAt
    },
    action
  };
}
