import React from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Card } from '@contentful/forma-36-react-components';
import Comment from './Comment.es6';
import CreateComment from './CreateEntryComment.es6';

const styles = {
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: '0',
    overflowY: 'auto',
    overflowX: 'hidden',
    color: tokens.colorTextMid,
    background: tokens.colorElementLightest,
    borderLeft: `1px solid ${tokens.colorElementDarkest}`,
    transition: 'transform .3s cubic-bezier(.38,.54,.5,.99)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1
  },
  commentForm: {
    borderTop: `1px solid ${tokens.colorElementLight}`,
    padding: tokens.spacingS
  }
};

export default class CommentsPanel extends React.Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    isVisible: true
  };

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_COMMENTS_PANEL, this.updateVisibility);
  }

  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_COMMENTS_PANEL, this.updateVisibility);
  }

  updateVisibility = ({ isVisible }) => {
    this.setState({
      isVisible
    });
  };

  render() {
    const { isVisible } = this.state;

    return (
      <div
        className={css({
          ...styles.root,
          transform: isVisible ? 'translateX(-1px)' : 'translateX(100%)'
        })}>
        <div className={css({ overflow: 'auto', padding: tokens.spacingS })}>
          <Card className={css({ padding: tokens.spacingS, marginBottom: tokens.spacingS })}>
            <Comment />
          </Card>
          <Card className={css({ padding: tokens.spacingS, marginBottom: tokens.spacingS })}>
            <Comment />
          </Card>
        </div>
        <div className={css(styles.commentForm)}>
          <CreateComment />
        </div>
      </div>
    );
  }
}
