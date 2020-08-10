import * as PublicContentType from 'widgets/PublicContentType';
import { ContentType, ContentTypeField } from 'contentful-ui-extensions-sdk';

interface InternalContentTypeField extends ContentTypeField {
  apiName: string; // the external id of an internal Content Type field
}

export interface InternalContentType extends ContentType {
  fields: InternalContentTypeField[];
}

export const createContentTypeApi = (internalContentType: InternalContentType): ContentType => {
  return PublicContentType.fromInternal(internalContentType) as ContentType;
};
