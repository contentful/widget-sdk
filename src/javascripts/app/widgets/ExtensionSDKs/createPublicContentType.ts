import { ContentType } from '@contentful/app-sdk';
import { InternalContentType } from './createContentTypeApi';

export function createPublicContentType(contentType: InternalContentType): ContentType {
  return {
    ...contentType,
    fields: contentType.fields.map(({ apiName, ...publicField }) => ({
      ...publicField,
      id: apiName,
    })),
  };
}
