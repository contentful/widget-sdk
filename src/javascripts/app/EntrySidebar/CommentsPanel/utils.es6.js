import { getUser } from 'services/TokenStore.es6';
import { get } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');

export function isCommentAuthor(comment) {
  const authorId = get(comment, 'sys.createdBy.sys.id');
  const userId = get(getUser(), 'sys.id');
  return authorId === userId;
}

export function canRemoveComment(comment) {
  const isAdmin = spaceContext.getData('spaceMembership.admin', false);
  return isAdmin || isCommentAuthor(comment);
}
