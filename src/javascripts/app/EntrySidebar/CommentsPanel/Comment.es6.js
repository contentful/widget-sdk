import React from 'react';
import moment from 'moment';
import { css } from 'emotion';
import {
  CardActions,
  DropdownList,
  DropdownListItem,
  Heading
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import * as types from './CommentPropTypes.es6';

export const styles = {
  comment: css({
    display: 'flex',
    flexDirection: 'column',
    marginBottom: tokens.spacingM,
    '&:last-child': {
      marginBottom: 0
    }
  }),
  header: css({
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingM
  }),
  avatar: css({
    width: 36,
    height: 36,
    background: tokens.colorElementLight,
    borderRadius: '100%',
    marginRight: tokens.spacingS
  }),
  meta: css({
    display: 'flex',
    justifyContent: 'space-between',
    flexGrow: 1,
    flexDirection: 'column'
  }),
  userName: css({
    fontSize: tokens.fontSizeM
  }),
  timestamp: css({
    color: tokens.colorTextLightest,
    fontSize: tokens.fontSizeS
  }),
  commentBody: css({
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap'
  })
};

export default function Comment({ comment }) {
  const {
    sys: { createdBy, createdAt }
  } = comment;
  const creationDate = moment(createdAt, moment.ISO_8601);
  return (
    <div className={styles.comment}>
      <header className={styles.header}>
        <img className={styles.avatar} src={createdBy.avatarUrl} />
        <div className={styles.meta}>
          <Heading element="h4" className={styles.userName}>
            {`${createdBy.firstName} ${createdBy.lastName}`}
          </Heading>
          <time
            dateTime={creationDate.toISOString()}
            title={creationDate.format('LLLL')}
            className={styles.timestamp}>
            {creationDate.fromNow()}
          </time>
        </div>
        <CardActions>
          <DropdownList>
            <DropdownListItem onClick={() => {}}>Edit</DropdownListItem>
            <DropdownListItem onClick={() => {}}>Reply</DropdownListItem>
            <DropdownListItem onClick={() => {}}>Mark as resolved</DropdownListItem>
          </DropdownList>
          <DropdownList border="top">
            <DropdownListItem onClick={() => {}}>Remove</DropdownListItem>
          </DropdownList>
        </CardActions>
      </header>
      <div className={styles.commentBody}>{comment.body}</div>
    </div>
  );
}

Comment.propTypes = {
  comment: types.Comment.isRequired
};
