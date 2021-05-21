export function create({ environmentId, entityId, action, scheduledFor, linkType, timezone }) {
  return {
    entity: {
      sys: {
        type: 'Link',
        linkType,
        id: entityId,
      },
    },
    environment: {
      sys: {
        type: 'Link',
        linkType: 'Environment',
        id: environmentId,
      },
    },
    scheduledFor: {
      datetime: scheduledFor,
      timezone,
    },
    action,
  };
}
