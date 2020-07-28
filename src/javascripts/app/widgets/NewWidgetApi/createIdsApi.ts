import { ContentType, FieldAPI, IdsAPI, User, EntryAPI } from 'contentful-ui-extensions-sdk';

export const createIdsApi = (
  spaceId: string,
  envId: string,
  contentType: ContentType,
  entry: EntryAPI,
  field: FieldAPI,
  user: User
): IdsAPI => {
  return {
    space: spaceId,
    environment: envId,
    contentType: contentType.sys.id,
    entry: entry.getSys().id,
    field: field.id,
    user: user.sys.id,
    extension: '', // TODO: should be optional in types
  };
};
