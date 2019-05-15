import React from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip,
  CardActions,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';

const styles = {
  task: css({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'start',
    backgroundColor: tokens.colorWhite,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingS
  }),

  body: css({
    flex: '1 1 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }),

  bodyExpanded: css({
    whiteSpace: 'normal',
    overflow: 'visible',
    textOverflow: 'clip'
  }),

  checkbox: css({
    marginRight: tokens.spacingXs
  }),

  avatar: css({
    display: 'block',
    width: '18px',
    height: '18px',
    background: tokens.colorElementLight,
    borderRadius: '100%',
    marginLeft: tokens.spacingS
  }),

  actions: css({
    display: 'inline-flex',
    marginLeft: 0,
    width: 0,
    overflow: 'hidden',
    transition: 'ease 0.2s'
  }),

  actionsVisible: css({
    marginLeft: tokens.spacingXs,
    width: '18px'
  })
};

export default class Task extends React.PureComponent {
  static propTypes = {
    assignedTo: PropTypes.object,
    body: PropTypes.string,
    resolved: PropTypes.bool
  };

  state = {
    isExpanded: false,
    hasVisibleActions: false
  };

  handleTaskExpand = () => {
    this.setState(prevState => ({ isExpanded: !prevState.isExpanded }));
  };

  handleTaskHover = () => {
    this.setState(prevState => ({ hasVisibleActions: !prevState.hasVisibleActions }));
  };

  render() {
    const { body, assignedTo, resolved } = this.props;
    return (
      <div
        className={styles.task}
        onMouseEnter={this.handleTaskHover}
        onMouseLeave={this.handleTaskHover}>
        <input type="checkbox" className={styles.checkbox} checked={resolved} />
        <div
          className={cx(styles.body, this.state.isExpanded && styles.bodyExpanded)}
          onClick={this.handleTaskExpand}>
          {body}
        </div>

        <Tooltip
          content={`Assigned to ${assignedTo.firstName} ${assignedTo.lastName}`}
          place="left">
          <img src={assignedTo.avatarUrl} className={styles.avatar} />
        </Tooltip>

        <CardActions
          className={cx(styles.actions, this.state.hasVisibleActions && styles.actionsVisible)}>
          <DropdownList>
            <DropdownListItem>Some action</DropdownListItem>
          </DropdownList>
        </CardActions>
      </div>
    );
  }
}
