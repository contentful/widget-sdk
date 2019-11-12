import PropTypes from 'prop-types';

export const Comment = PropTypes.shape({
  body: PropTypes.string.isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['Comment']),
    commentType: PropTypes.oneOf(['Entry']),
    space: PropTypes.any,
    entry: PropTypes.object,
    createdBy: PropTypes.date,
    createdAt: PropTypes.string,
    updatedBy: PropTypes.object,
    updatedAt: PropTypes.string
  })
});

export const CommentThread = PropTypes.arrayOf(Comment);
