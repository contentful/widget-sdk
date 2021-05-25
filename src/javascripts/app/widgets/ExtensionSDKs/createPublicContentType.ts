import { ContentType } from '@contentful/app-sdk';
import { omit } from 'lodash';
import { InternalContentType } from './createContentTypeApi';

export function createPublicContentType(contentType: InternalContentType): ContentType {
  return {
    ...contentType,
    fields: contentType.fields.map((field) => ({
      ...omit(field, 'apiName'),
      id: field.apiName,
    })),
  };
}
