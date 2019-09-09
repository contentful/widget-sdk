import { getUserSync } from 'services/TokenStore.es6';
import { get } from 'lodash';
import { getModule } from 'NgRegistry.es6';

export function isCommentAuthor(comment) {
  const authorId = get(comment, 'sys.createdBy.sys.id');
  const userId = get(getUserSync(), 'sys.id');
  return authorId === userId;
}

export function canRemoveComment(comment) {
  const spaceContext = getModule('spaceContext');
  const isAdmin = spaceContext.getData('spaceMember.admin', false);
  return isAdmin || isCommentAuthor(comment);
}

// Get a flat list of comments and return a bidimensional
// array containing comments and its replies
export function fromFlatToThreads(comments = []) {
  const sorted = comments.sort(byCreateAt);
  const parents = sorted.filter(comment => !comment.sys.parent);
  const threads = parents.map(comment => [comment, ...comments.filter(isReplyToComment(comment))]);

  // [[comment, reply1, reply2], ...]
  return threads;
}

export function isReplyToComment(possibleParent) {
  return possibleChild => {
    const commentId = get(possibleParent, 'sys.id');
    const parentId = get(possibleChild, 'sys.parent.sys.id');
    return parentId === commentId;
  };
}

export function isReply(comment) {
  return !!get(comment, 'sys.parent');
}

function byCreateAt(a, b) {
  return new Date(a.sys.createdAt) - new Date(b.sys.createdAt);
}
