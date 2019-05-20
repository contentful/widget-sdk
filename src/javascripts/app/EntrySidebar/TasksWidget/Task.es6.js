import React from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip,
  TextLink,
  Form,
  TextField,
  SelectField,
  Option,
  Button,
  TabFocusTrap
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import RelativeDateTime from 'components/shared/RelativeDateTime/index.es6';
import isHotKey from 'is-hotkey';
import TaskDeleteDialog from './TaskDeleteDialog.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

const styles = {
  task: css({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'start',
    backgroundColor: tokens.colorWhite,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    outline: 'none',
    ':hover': {
      backgroundColor: tokens.colorElementLightest
    },
    ':focus': {
      backgroundColor: tokens.colorElementLightest,
      outline: `1px solid ${tokens.colorPrimary}`,
      borderRadius: '2px',
      boxShadow: tokens.glowPrimary
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

  editForm: css({
    width: '100%',
    padding: tokens.spacingS
  }),

  editActions: css({
    display: 'flex'
  }),

  editTaskLink: css({
    marginRight: tokens.spacingS
  }),

  editSubmit: css({
    marginRight: tokens.spacingS
  }),

  tabFocusTrap: css({
    width: '100%'
  })
};

export default class Task extends React.PureComponent {
  static propTypes = {
    assignedTo: PropTypes.object,
    body: PropTypes.string,
    createdAt: PropTypes.string,
    resolved: PropTypes.bool
  };

  state = {
    isExpanded: false,
    hasVisibleActions: false,
    hasEditForm: false
  };

  handleTaskKeyDown = event => {
    if (isHotKey('enter', event)) {
      this.handleTaskExpand();
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
    this.setState({ hasEditForm: true });
  };

  handleDeleteClick = async event => {
    event.stopPropagation();
    return ModalLauncher.open(({ isShown, onClose }) => (
      <TaskDeleteDialog
        key={Date.now()}
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={() => {
          // eslint-disable-next-line no-console
          console.log('delete');
          onClose(true);
        }}
      />
    ));
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
        <TextLink onClick={this.handleEditClick} className={styles.editTaskLink}>
          Edit task
        </TextLink>
        <TextLink linkType="negative" onClick={this.handleDeleteClick}>
          Delete task
        </TextLink>
      </React.Fragment>
    );
  };

  renderDetails = () => {
    const { body, assignedTo, createdAt } = this.props;
    return (
      <React.Fragment>
        <div
          className={cx(styles.body, this.state.isExpanded && styles.bodyExpanded)}
          onClick={this.handleTaskExpand}>
          {body}
          {this.state.isExpanded && (
            <React.Fragment>
              {this.state.hasEditForm && this.renderEditForm()}
              <div className={styles.meta}>
                <div>
                  Created by {assignedTo.firstName} {assignedTo.lastName}
                </div>
                <div>
                  Created <RelativeDateTime value={createdAt} />
                </div>
                <div>{this.renderActions()}</div>
              </div>
            </React.Fragment>
          )}
        </div>
        <div className={styles.avatarWrapper}>{this.renderAvatar()}</div>
      </React.Fragment>
    );
  };

  renderEditForm = () => {
    const { body, assignedTo } = this.props;

    return (
      <Form spacing="condensed" onClick={e => e.stopPropagation()} className={styles.editForm}>
        <TextField
          name="body"
          id="body"
          labelText="Edit task"
          textarea
          value={body}
          textInputProps={{ rows: 4 }}
        />
        <SelectField name="assignee" id="assignee" labelText="Assign to">
          <Option value="1">
            {assignedTo.firstName} {assignedTo.lastName}
          </Option>
          <Option value="2">User 2</Option>
          <Option value="3">User 3</Option>
        </SelectField>
        <div className={styles.editActions}>
          <Button buttonType="positive" className={styles.editSubmit} size="small">
            Save changes
          </Button>
          <Button buttonType="muted" onClick={this.handleCancelEdit} size="small">
            Cancel
          </Button>
        </div>
      </Form>
    );
  };

  render() {
    const { resolved } = this.props;

    return (
      <div
        className={styles.task}
        onMouseEnter={this.handleTaskHover}
        onMouseLeave={this.handleTaskHover}
        onKeyDown={this.handleTaskKeyDown}
        tabIndex={0}>
        <TabFocusTrap className={styles.tabFocusTrap}>
          <div className={styles.checkboxWrapper}>
            <input type="checkbox" checked={resolved} />
          </div>
          {this.state.hasEditForm ? this.renderEditForm() : this.renderDetails()}
        </TabFocusTrap>
      </div>
    );
  }
}
