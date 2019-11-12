import { getModule } from 'NgRegistry';
import createContentPreview from './createContentPreview';

let contentPreviewInstance = null;

export function getContentPreview() {
  const spaceContext = getModule('spaceContext');
  const space = spaceContext.getSpace();

  if (!contentPreviewInstance) {
    contentPreviewInstance = createContentPreview({ space, cma: spaceContext.cma });
  }

  return contentPreviewInstance;
}

export function purgeContentPreviewCache() {
  contentPreviewInstance = null;
}
