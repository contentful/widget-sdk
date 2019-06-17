import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  CardActions,
  DropdownList,
  DropdownListItem,
  Form,
  Option,
  SelectField,
  TabFocusTrap,
  TextField,
  Tooltip,
  SkeletonContainer,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import moment from 'moment';
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
    transition: `background-color ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}`,
    outline: 'none',
    ':hover': {
      backgroundColor: tokens.colorElementLight
    },
    ':focus': {
      backgroundColor: tokens.colorElementLight,
      outline: `1px solid ${tokens.colorPrimary}`,
      borderRadius: '2px',
      boxShadow: tokens.glowPrimary
    }
  }),

  taskLoading: css({
    padding: tokens.spacingS,
    cursor: 'default',
    ':hover': {
      backgroundColor: tokens.colorWhite
    },
    ':focus': {
      backgroundColor: tokens.colorWhite,
      outline: 'none',
      borderRadius: 0,
      boxShadow: 'none'
    }
  }),

  taskHasEditForm: css({
    cursor: 'default',
    ':hover': {
      backgroundColor: tokens.colorWhite
    },
    ':focus': {
      backgroundColor: tokens.colorWhite,
      outline: 'none',
      borderRadius: 0,
      boxShadow: 'none'
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
    paddingLeft: 0,
    alignItems: 'flex-start'
  }),

  bodyExpanded: css({
    textOverflow: 'clip',
    whiteSpace: 'pre-line',
    wordWrap: 'break-word',
    overflow: 'hidden'
  }),

  meta: css({
    marginTop: tokens.spacingXs,
    color: tokens.colorTextMid,
    lineHeight: tokens.lineHeightDefault,
    fontSize: tokens.fontSizeS
  }),

  avatar: css({
    display: 'block',
    width: '18px',
    height: '18px',
    background: tokens.colorElementLight,
    borderRadius: '100%'
  }),

  actions: css({
    display: 'inline-block',
    marginLeft: 0,
    width: 0,
    height: '18px',
    overflow: 'hidden',
    transition: `width ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}, margin-left ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}`
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
    resolved: PropTypes.bool,
    isDraft: PropTypes.bool,
    taskKey: PropTypes.string,
    onCancelDraft: PropTypes.func,
    onCreateTask: PropTypes.func,
    onUpdateTask: PropTypes.func,
    onDeleteTask: PropTypes.func,
    onCompleteTask: PropTypes.func,
    isLoading: PropTypes.bool,
    validationMessage: PropTypes.string
  };

  state = {
    isExpanded: false,
    hasVisibleActions: false,
    hasEditForm: false,
    body: ''
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

  handleSubmit = (isDraft, taskKey) => {
    if (isDraft) {
      this.props.onCreateTask(taskKey, this.state.body);
    } else {
      this.props.onUpdateTask(taskKey, this.state.body);
      this.setState({ hasEditForm: false, isDraft: false });
    }
  };

  handleDeleteClick = async (event, taskKey) => {
    event.stopPropagation();
    return ModalLauncher.open(({ isShown, onClose }) => (
      <TaskDeleteDialog
        key={Date.now()}
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={() => {
          this.props.onDeleteTask(taskKey);
          onClose(true);
        }}
      />
    ));
  };

  handleCancelEdit = (event, isDraft) => {
    event.stopPropagation();

    if (isDraft) {
      this.props.onCancelDraft();
    } else {
      this.setState({ hasEditForm: false });
    }
  };

  renderFullName = userObject => {
    return `${userObject.firstName} ${userObject.lastName}`;
  };

  renderAvatar = () => {
    const { assignedTo } = this.props;

    return (
      <Tooltip content={`Assigned to ${this.renderFullName(assignedTo)}`} place="left">
        <img src={assignedTo.avatarUrl} className={styles.avatar} />
      </Tooltip>
    );
  };

  renderActions = taskKey => {
    // TODO: Check roles/permissions before rendering actions
    return (
      <CardActions className={cx(styles.actions, this.state.isExpanded && styles.actionsVisible)}>
        <DropdownList>
          <DropdownListItem onClick={this.handleEditClick}>Edit task</DropdownListItem>
          <DropdownListItem onClick={event => this.handleDeleteClick(event, taskKey)}>
            Delete task
          </DropdownListItem>
        </DropdownList>
      </CardActions>
    );
  };

  renderDetails = () => {
    const { body, assignedTo, createdAt, resolved, taskKey } = this.props;
    return (
      <React.Fragment>
        <div className={styles.checkboxWrapper}>
          <input
            type="checkbox"
            checked={resolved}
            onChange={() => this.props.onCompleteTask(taskKey)}
          />
        </div>
        <div
          className={cx(styles.body, this.state.isExpanded && styles.bodyExpanded)}
          onClick={this.handleTaskExpand}>
          {body}
          {this.state.isExpanded && (
            <React.Fragment>
              {this.state.hasEditForm && this.renderEditForm()}
              <div className={styles.meta}>
                Created{' '}
                <time
                  dateTime={moment(createdAt, moment.ISO_8601).toISOString()}
                  title={moment(createdAt, moment.ISO_8601).format('LLLL')}
                  className={styles.timestamp}>
                  {moment(createdAt, moment.ISO_8601).fromNow()}
                </time>{' '}
                by {this.renderFullName(assignedTo)}
              </div>
            </React.Fragment>
          )}
        </div>
        <div className={styles.avatarWrapper}>
          {this.renderAvatar()}
          {this.renderActions(taskKey)}
        </div>
      </React.Fragment>
    );
  };

  handleBodyUpdate = event => {
    this.setState({
      body: event.target.value
    });
  };

  renderEditForm = () => {
    const { taskKey, body, assignedTo, isDraft, validationMessage } = this.props;

    const bodyLabel = isDraft ? 'Create task' : 'Edit task';
    const ctaLabel = isDraft ? 'Create task' : 'Save changes';
    const ctaContext = isDraft ? 'primary' : 'positive';
    const characterLimit = 3000;

    return (
      <Form spacing="condensed" onClick={e => e.stopPropagation()} className={styles.editForm}>
        <TextField
          name="body"
          id="body"
          labelText={bodyLabel}
          textarea
          value={body}
          onBlur={event => this.handleBodyUpdate(event)}
          textInputProps={{ rows: 4, autoFocus: true, maxLength: characterLimit }}
          validationMessage={validationMessage}
        />
        <SelectField name="assignee" id="assignee" labelText="Assign to">
          <Option value="1">{this.renderFullName(assignedTo)}</Option>
          <Option value="2">User 2</Option>
          <Option value="3">User 3</Option>
        </SelectField>
        <div className={styles.editActions}>
          <Button
            buttonType={ctaContext}
            className={styles.editSubmit}
            onClick={() => this.handleSubmit(isDraft, taskKey)}
            size="small">
            {ctaLabel}
          </Button>
          <Button
            buttonType="muted"
            onClick={event => this.handleCancelEdit(event, isDraft)}
            size="small">
            Cancel
          </Button>
        </div>
      </Form>
    );
  };

  renderLoadingState() {
    return (
      <div className={cx(styles.task, styles.taskLoading)}>
        <SkeletonContainer svgHeight={18}>
          <SkeletonBodyText numberOfLines={1} />
        </SkeletonContainer>
      </div>
    );
  }

  renderTask() {
    const { isDraft } = this.props;

    return (
      <div
        className={cx(styles.task, (this.state.hasEditForm || isDraft) && styles.taskHasEditForm)}
        onMouseEnter={this.handleTaskHover}
        onMouseLeave={this.handleTaskHover}
        onKeyDown={this.handleTaskKeyDown}
        tabIndex={0}>
        <TabFocusTrap className={styles.tabFocusTrap}>
          {this.state.hasEditForm || isDraft ? this.renderEditForm() : this.renderDetails()}
        </TabFocusTrap>
      </div>
    );
  }

  render() {
    const { isLoading } = this.props;

    return (
      <React.Fragment>{isLoading ? this.renderLoadingState() : this.renderTask()}</React.Fragment>
    );
  }
}
