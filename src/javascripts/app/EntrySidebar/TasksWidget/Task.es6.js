import React from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip,
  CardActions,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  task: css({
    backgroundColor: tokens.colorWhite,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingS
  }),

  summary: css({
    flex: '1 1 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }),

  previewContent: css({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'start'
  }),

  summaryExpanded: css({
    flex: '1 1 0',
    whiteSpace: 'expanded',
    overflow: 'visible'
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
    marginLeft: tokens.spacingXs
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
        onClick={this.handleTaskExpand}
        onMouseEnter={this.handleTaskHover}
        onMouseLeave={this.handleTaskHover}>
        <div className={styles.previewContent}>
          <input type="checkbox" className={styles.checkbox} checked={resolved} />
          <div className={this.state.isExpanded ? styles.summaryExpanded : styles.summary}>
            {body}
          </div>

          <Tooltip
            content={`Assigned to ${assignedTo.firstName} ${assignedTo.lastName}`}
            place="left">
            <img src={assignedTo.avatarUrl} className={styles.avatar} />
          </Tooltip>

          {this.state.hasVisibleActions && (
            <CardActions className={styles.actions}>
              <DropdownList>
                <DropdownListItem>Some action</DropdownListItem>
              </DropdownList>
            </CardActions>
          )}
        </div>
      </div>
    );
  }
}
