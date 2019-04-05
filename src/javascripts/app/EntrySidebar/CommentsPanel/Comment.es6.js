import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  CardActions,
  DropdownList,
  DropdownListItem,
  Heading,
  TextLink
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import CreateComment from './CreateEntryComment.es6';

const styles = {
  comment: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: tokens.spacingM,
    '&:last-child': {
      marginBottom: 0
    }
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingM
  },
  avatar: {
    width: 36,
    height: 36,
    background: tokens.colorElementLight,
    borderRadius: '100%',
    marginRight: tokens.spacingS
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    flexGrow: 1,
    flexDirection: 'column'
  },
  userName: {
    fontSize: tokens.fontSizeM
  },
  timestamp: {
    color: tokens.colorTextLightest,
    fontSize: tokens.fontSizeS
  },
  footer: {
    marginTop: tokens.spacingM
  },
  thread: {
    paddingLeft: tokens.spacingS,
    boxShadow: `inset 2px 0 0 ${tokens.colorBlueDark}`,
    marginLeft: `-${tokens.spacingS}`
  },
  showCommentsButton: {
    margin: `${tokens.spacingM} 0`
  },
  replyActions: {
    marginTop: tokens.spacingS
  }
};

export default function Comment(props) {
  return (
    <div className={css(styles.comment)}>
      <header className={css(styles.header)}>
        <img
          className={css(styles.avatar)}
          src="https://www.gravatar.com/avatar/114482f1a617ddfee34f8d314c33a1e3?s=50&d=https%3A%2F%2Fstatic.quirely.com%2Fgatekeeper%2Fusers%2Fdefault-a4327b54b8c7431ea8ddd9879449e35f051f43bd767d83c5ff351aed9db5986e.png"
        />
        <div className={css(styles.meta)}>
          <Heading element="h4" className={css(styles.userName)}>
            Guilherme Barbosa
          </Heading>
          <time dateTime="2019-04-01T12:00" className={css(styles.timestamp)}>
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
      <div>
        <p>I think the title does not reflect the content of the post. We should change that.</p>
        <p>
          Also, there are a couple of typos in the text. We should consider having spell check
          running.
        </p>
      </div>

      {!props.child && (
        <React.Fragment>
          <TextLink icon="ChevronRightTrimmed" className={css(styles.showCommentsButton)}>
            Show all 10 replies
          </TextLink>

          <div className={css(styles.thread)}>
            <Comment child={true} />
          </div>

          <footer className={css(styles.footer)}>
            <CreateComment parentCommentId="abc" />
          </footer>
        </React.Fragment>
      )}
    </div>
  );
}

Comment.propTypes = {
  child: PropTypes.bool
};
