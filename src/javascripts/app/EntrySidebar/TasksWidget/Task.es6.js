import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  CardActions,
  DropdownList,
  DropdownListItem,
  Form,
  Notification,
  Option,
  SelectField,
  TabFocusTrap,
  TextField,
  Tooltip,
  SkeletonContainer,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import Visible from 'components/shared/Visible/index.es6';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import moment from 'moment';
import isHotKey from 'is-hotkey';
import TaskDeleteDialog from './TaskDeleteDialog.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { TaskViewData } from './TasksViewData.es6';

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

export default class Task extends React.Component {
  static propTypes = {
    viewData: PropTypes.shape(TaskViewData),
    isLoading: PropTypes.bool,
    onCancelDraft: PropTypes.func,
    onCreateTask: PropTypes.func,
    onUpdateTask: PropTypes.func,
    onDeleteTask: PropTypes.func,
    onCompleteTask: PropTypes.func
  };

  state = {
    isExpanded: false,
    hasEditForm: false,
    body: ''
  };

  componentDidUpdate(prevProps) {
    const { validationMessage } = this.props.viewData;
    if (
      !this.state.hasEditForm &&
      validationMessage &&
      validationMessage !== prevProps.viewData.validationMessage
    ) {
      // We don't have a place on the actual task card to show a deletion error.
      Notification.error(validationMessage);
    }
  }

  handleTaskKeyDown = event => {
    if (isHotKey('enter', event)) {
      this.handleTaskExpand();
    }
  };

  handleTaskExpand = () => {
    this.setState(prevState => ({ isExpanded: !prevState.isExpanded }));
  };

  handleEditClick = event => {
    event.stopPropagation();
    this.setState({ hasEditForm: true });
  };

  handleSubmit = (isDraft, key) => {
    const { body } = this.state;
    isDraft ? this.props.onCreateTask(key, body) : this.props.onUpdateTask(key, body);
  };

  handleDeleteClick = async (event, key) => {
    event.stopPropagation();
    return ModalLauncher.open(({ isShown, onClose }) => (
      <TaskDeleteDialog
        key={Date.now()}
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={() => {
          this.props.onDeleteTask(key);
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
    return userObject ? `${userObject.firstName} ${userObject.lastName}` : 'unknown user';
  };

  renderAvatar = () => {
    const { assignee } = this.props.viewData;

    if (!assignee) {
      return <div />;
    }
    return (
      <Tooltip content={`Assigned to ${this.renderFullName(assignee)}`} place="left">
        <img src={assignee.avatarUrl} className={styles.avatar} onClick={this.handleTaskExpand} />
      </Tooltip>
    );
  };

  renderActions = key => {
    // TODO: Check roles/permissions before rendering actions
    return (
      <CardActions className={cx(styles.actions, this.state.isExpanded && styles.actionsVisible)}>
        <DropdownList>
          <DropdownListItem onClick={this.handleEditClick}>Edit task</DropdownListItem>
          <DropdownListItem onClick={event => this.handleDeleteClick(event, key)}>
            Delete task
          </DropdownListItem>
        </DropdownList>
      </CardActions>
    );
  };

  renderDetails = () => {
    const { isExpanded } = this.state;
    const { key, body, creator, createdAt, isDone } = this.props.viewData;

    return (
      <React.Fragment>
        <div className={styles.checkboxWrapper}>
          <input type="checkbox" checked={isDone} onChange={() => this.props.onCompleteTask(key)} />
        </div>
        <div
          className={cx(styles.body, isExpanded && styles.bodyExpanded)}
          onClick={this.handleTaskExpand}>
          {body}
          <Visible if={isExpanded}>
            <div className={styles.meta}>
              Created{' '}
              <Visible if={createdAt}>
                <time
                  dateTime={moment(createdAt, moment.ISO_8601).toISOString()}
                  title={moment(createdAt, moment.ISO_8601).format('LLLL')}
                  className={styles.timestamp}>
                  {moment(createdAt, moment.ISO_8601).fromNow()}
                </time>{' '}
              </Visible>
              by {this.renderFullName(creator)}
            </div>
          </Visible>
        </div>
        <div className={styles.avatarWrapper}>
          {this.renderAvatar()}
          {this.renderActions(key)}
        </div>
      </React.Fragment>
    );
  };

  handleBodyUpdate = event => {
    this.setState({ body: event.target.value });
  };

  renderEditForm = () => {
    const { key, body, assignee, isDraft, validationMessage } = this.props.viewData;
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
          <Option value="1">{this.renderFullName(assignee)}</Option>
          <Option value="2">User 2</Option>
          <Option value="3">User 3</Option>
        </SelectField>
        <div className={styles.editActions}>
          <Button
            buttonType={ctaContext}
            className={styles.editSubmit}
            onClick={() => this.handleSubmit(isDraft, key)}
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
    const { hasEditForm } = this.state;
    const { isDraft } = this.props.viewData;

    return (
      <div
        className={cx(styles.task, (hasEditForm || isDraft) && styles.taskHasEditForm)}
        onKeyDown={this.handleTaskKeyDown}
        tabIndex={0}>
        <TabFocusTrap className={styles.tabFocusTrap}>
          {hasEditForm || isDraft ? this.renderEditForm() : this.renderDetails()}
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
