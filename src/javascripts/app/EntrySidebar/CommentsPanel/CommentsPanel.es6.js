import React from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const sidebarPanelStyles = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  padding: '1.6rem',
  overflowY: 'auto',
  overflowX: 'hidden',
  color: tokens.colorTextMid,
  background: tokens.colorElementLightest,
  borderLeft: `1px solid ${tokens.colorElementDarkest}`
};

export default class CommentsPanel extends React.Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    isVisible: false
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
          ...sidebarPanelStyles,
          zIndex: 1,
          transition: 'transform .3s cubic-bezier(.38,.54,.5,.99)',
          transform: isVisible ? 'translateX(-1px)' : 'translateX(100%)'
        })}>
        <p>Hello world!</p>
      </div>
    );
  }
}
