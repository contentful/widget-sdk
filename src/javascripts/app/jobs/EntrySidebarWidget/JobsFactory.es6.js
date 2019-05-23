export function create({ spaceId, environmentId, entityId, userId, action, scheduledAt }) {
  return {
    sys: {
      space: {
        sys: {
          type: 'Link',
          id: spaceId
        }
      },
      environment: {
        sys: {
          type: 'Link',
          id: environmentId
        }
      },
      entity: {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: entityId
        }
      },
      scheduledBy: {
        sys: {
          type: 'Link',
          id: userId
        }
      }
    },
    action,
    scheduledAt
  };
}
