export function create({ environmentId, entityId, action, scheduledAt, linkType, timezone }) {
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
      datetime: scheduledAt,
      timezone,
    },
    action,
  };
}
