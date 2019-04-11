import React from 'react';
import { css } from 'emotion';
import {
  CardActions,
  DropdownList,
  DropdownListItem,
  Heading
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import * as types from './CommentPropTypes.es6';

const styles = {
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
  })
};

export default function Comment({ comment }) {
  return (
    <div className={styles.comment}>
      <header className={styles.header}>
        <img
          className={styles.avatar}
          src="https://www.gravatar.com/avatar/114482f1a617ddfee34f8d314c33a1e3?s=50&d=https%3A%2F%2Fstatic.quirely.com%2Fgatekeeper%2Fusers%2Fdefault-a4327b54b8c7431ea8ddd9879449e35f051f43bd767d83c5ff351aed9db5986e.png"
        />
        <div className={styles.meta}>
          <Heading element="h4" className={styles.userName}>
            Guilherme Barbosa
          </Heading>
          <time dateTime="2019-04-01T12:00" className={styles.timestamp}>
            1 day ago
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
      <div>{comment.body}</div>
    </div>
  );
}

Comment.propTypes = {
  comment: types.Comment.isRequired
};
