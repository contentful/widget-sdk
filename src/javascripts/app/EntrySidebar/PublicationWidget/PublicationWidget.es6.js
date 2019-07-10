import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { every } from 'lodash';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Icon
} from '@contentful/forma-36-react-components';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import RelativeTimeData from 'components/shared/RelativeDateTime/index.es6';
import CommandPropType from 'app/entity_editor/CommandPropType.es6';

const StatusBadge = ({ status }) => (
  <div className="published-status" data-state={status} data-test-id="entity-state">
    <strong>Status: </strong>
    {status === 'archived' && <span>Archived</span>}
    {status === 'draft' && <span>Draft</span>}
    {status === 'published' && <span>Published</span>}
    {status === 'changes' && <span>Published (pending changes)</span>}
  </div>
);

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};

const ActionRestrictedNote = ({ actionName }) => (
  <p className="f36-color--text-light f36-margin-top--xs" data-test-id="action-restriction-note">
    <Icon icon="Lock" color="muted" className="action-restricted__icon" />
    You do not have permission to {actionName.toLowerCase()}.
  </p>
);

ActionRestrictedNote.propTypes = {
  actionName: PropTypes.string.isRequired
};

const RestrictedAction = ({ actionName }) => (
  <React.Fragment>
    <Icon
      icon="Lock"
      color="muted"
      className="action-restricted__icon"
      testId="action-restriction-icon"
    />
    {actionName}
  </React.Fragment>
);

RestrictedAction.propTypes = {
  actionName: PropTypes.string.isRequired
};

export default class PublicationWidget extends React.PureComponent {
  static propTypes = {
    status: PropTypes.string.isRequired,
    isSaving: PropTypes.bool.isRequired,
    updatedAt: PropTypes.string,
    revert: CommandPropType,
    primary: CommandPropType,
    secondary: PropTypes.arrayOf(CommandPropType.isRequired).isRequired,

    spaceId: PropTypes.string,
    environmentId: PropTypes.string,
    userId: PropTypes.string,
    entity: PropTypes.object
  };

  state = {
    isOpenDropdown: false
  };

  render() {
    const { primary, status, secondary, isSaving, updatedAt, revert } = this.props;
    const secondaryActionsDisabled = every(secondary || [], action => action.isDisabled());
    return (
      <EntrySidebarWidget title="Status">
        <StatusBadge status={status} />
        <div className="entity-sidebar__state-select">
          <div className="publish-buttons-row">
            {status !== 'published' && primary && (
              <React.Fragment>
                <Button
                  isFullWidth
                  buttonType="positive"
                  disabled={primary.isDisabled()}
                  loading={primary.inProgress()}
                  testId={`change-state-${primary.targetStateId}`}
                  onClick={() => {
                    primary.execute();
                  }}
                  className="primary-publish-button">
                  {primary.label}
                </Button>
              </React.Fragment>
            )}
            <Dropdown
              className="secondary-publish-button-wrapper"
              position="bottom-right"
              isOpen={this.state.isOpenDropdown}
              onClose={() => {
                this.setState({ isOpenDropdown: false });
              }}
              toggleElement={
                <Button
                  className="secondary-publish-button"
                  isFullWidth
                  disabled={secondaryActionsDisabled}
                  testId="change-state-menu-trigger"
                  buttonType="positive"
                  indicateDropdown
                  onClick={() => {
                    this.setState(state => ({ isOpenDropdown: !state.isOpenDropdown }));
                  }}>
                  {status === 'published' ? 'Change status' : ''}
                </Button>
              }>
              <DropdownList testId="change-state-menu">
                <DropdownListItem isTitle>Change status to</DropdownListItem>
                {secondary &&
                  secondary.map(
                    action =>
                      action.isAvailable() && (
                        <DropdownListItem
                          key={action.label}
                          testId={`change-state-${action.targetStateId}`}
                          onClick={() => {
                            action.execute();
                            this.setState({ isOpenDropdown: false });
                          }}
                          isDisabled={action.isDisabled()}>
                          {action.isRestricted() ? (
                            <RestrictedAction actionName={action.label} />
                          ) : (
                            action.label
                          )}
                        </DropdownListItem>
                      )
                  )}
              </DropdownList>
            </Dropdown>
          </div>
          {primary && primary.isRestricted() && <ActionRestrictedNote actionName={primary.label} />}
        </div>
        <div className="entity-sidebar__status-more">
          {updatedAt && (
            <div className="entity-sidebar__save-status">
              <i
                className={classNames('entity-sidebar__saving-spinner', {
                  'x--active': isSaving
                })}
              />
              <span className="entity-sidebar__last-saved" data-test-id="last-saved">
                Last saved <RelativeTimeData value={updatedAt} />
              </span>
            </div>
          )}
          {revert && revert.isAvailable() && (
            <button
              className="entity-sidebar__revert btn-link"
              data-test-id="discard-changed-button"
              onClick={() => revert.execute()}>
              Discard changes
            </button>
          )}
        </div>
      </EntrySidebarWidget>
    );
  }
}
