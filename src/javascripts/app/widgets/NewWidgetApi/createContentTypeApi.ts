import * as PublicContentType from 'widgets/PublicContentType';
import { ContentType } from 'contentful-ui-extensions-sdk';

export const createContentTypeApi = (internalContentType: any): ContentType => {
  return PublicContentType.fromInternal(internalContentType) as ContentType;
};
