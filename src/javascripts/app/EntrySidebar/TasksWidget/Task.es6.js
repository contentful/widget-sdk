import React from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip,
  TextLink,
  Form,
  TextField,
  SelectField,
  Option,
  Button
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
    ':hover, :focus': {
      backgroundColor: tokens.colorElementLightest
    }
  }),

  body: css({
    flex: '1 1 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: tokens.spacingS
  }),

  checkboxWrapper: css({
    padding: tokens.spacingS,
    paddingRight: 0
  }),

  avatarWrapper: css({
    display: 'inline-flex',
    padding: tokens.spacingS,
    paddingLeft: 0
  }),

  bodyExpanded: css({
    whiteSpace: 'normal',
    overflow: 'visible',
    textOverflow: 'clip'
  }),

  meta: css({
    marginTop: tokens.spacingXs,
    color: tokens.colorTextLight,
    lineHeight: tokens.lineHeightDefault
  }),

  avatar: css({
    display: 'block',
    width: '18px',
    height: '18px',
    background: tokens.colorElementLight,
    borderRadius: '100%'
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
  }),

  editActions: css({
    display: 'flex'
  }),

  editSubmit: css({
    marginRight: tokens.spacingS
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
    hasVisibleActions: false,
    hasEditForm: false
  };

  handleTaskKeyDown = event => {
    const ENTER_KEY_CODE = 13;

    if (event.keyCode === ENTER_KEY_CODE) {
      event.stopPropagation();
      this.setState(prevState => ({ isExpanded: !prevState.isExpanded }));
    }
  };

  handleTaskExpand = () => {
    this.setState(prevState => ({ isExpanded: !prevState.isExpanded }));
  };

  handleTaskHover = () => {
    this.setState(prevState => ({ hasVisibleActions: !prevState.hasVisibleActions }));
  };

  handleEditClick = event => {
    event.stopPropagation();
    // eslint-disable-next-line no-console
    console.log('edit');

    this.setState({ hasEditForm: true });
  };

  handleDeleteClick = event => {
    event.stopPropagation();
    // eslint-disable-next-line no-console
    console.log('delete');
  };

  handleCancelEdit = event => {
    event.stopPropagation();
    this.setState({ hasEditForm: false });
  };

  renderAvatar = () => {
    const { assignedTo } = this.props;
    const assigneeName = `${assignedTo.firstName} ${assignedTo.lastName}`;

    return (
      <Tooltip content={`Assigned to ${assigneeName}`} place="left">
        <img src={assignedTo.avatarUrl} className={styles.avatar} />
      </Tooltip>
    );
  };

  renderActions = () => {
    // TODO: Check roles/permissions before rendering actions
    return (
      <React.Fragment>
        <TextLink onClick={this.handleEditClick}>Edit task</TextLink> /{' '}
        <TextLink onClick={this.handleDeleteClick}>Delete task</TextLink>
      </React.Fragment>
    );
  };

  renderEditForm = () => {
    return (
      <Form spacing="condensed" onClick={e => e.stopPropagation()}>
        <TextField name="body" id="body" labelText="Edit task" textarea value={this.props.body} />
        <SelectField name="assignee" id="assignee" labelText="Assigned to">
          <Option value="1">User 1</Option>
          <Option value="2">User 2</Option>
          <Option value="3">User 3</Option>
        </SelectField>
        <div className={styles.editActions}>
          <Button buttonType="positive" className={styles.editSubmit}>
            Submit
          </Button>
          <Button buttonType="muted" onClick={this.handleCancelEdit}>
            Cancel
          </Button>
        </div>
      </Form>
    );
  };

  render() {
    const { body, assignedTo, resolved } = this.props;
    return (
      <div
        className={styles.task}
        onMouseEnter={this.handleTaskHover}
        onMouseLeave={this.handleTaskHover}
        onKeyDown={this.handleTaskKeyDown}
        tabIndex={0}>
        <div className={styles.checkboxWrapper}>
          <input type="checkbox" checked={resolved} />
        </div>
        <div
          className={cx(styles.body, this.state.isExpanded && styles.bodyExpanded)}
          onClick={this.handleTaskExpand}>
          {!this.state.hasEditForm && body}
          {this.state.isExpanded && (
            <React.Fragment>
              {this.state.hasEditForm && this.renderEditForm()}
              <div className={styles.meta}>
                <div>
                  Created by {assignedTo.firstName} {assignedTo.lastName}
                </div>
                <div>Created at {assignedTo.sys.createdAt}</div>
                <div>{this.renderActions()}</div>
              </div>
            </React.Fragment>
          )}
        </div>
        <div className={styles.avatarWrapper}>{this.renderAvatar()}</div>
      </div>
    );
  }
}
