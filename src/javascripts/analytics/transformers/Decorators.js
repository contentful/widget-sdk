import { merge } from 'lodash';

export function addUserOrgSpace(transformer) {
  return (_, data) =>
    merge(transformer(_, data), {
      data: {
        organization_id: data.organizationId,
        space_id: data.spaceId,
        executing_user_id: data.userId
      }
    });
}
