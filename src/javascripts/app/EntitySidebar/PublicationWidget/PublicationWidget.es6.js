import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { every } from 'lodash';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import RelativeTimeData from 'components/shared/RelativeDateTime/index.es6';

const PublicationStatus = ({ status }) => (
  <div className="entity-sidebar__state">
    <span
      className="entity-sidebar__state-indicator"
      data-state={status}
      data-test-id="entity-state"
    />
    <strong>Status: </strong>
    {status === 'archived' && <span>Archived</span>}
    {status === 'draft' && <span>Draft</span>}
    {status === 'published' && <span>Published</span>}
    {status === 'changes' && <span>Published (pending changes)</span>}
  </div>
);

PublicationStatus.propTypes = {
  status: PropTypes.string.isRequired
};

const CommandPropType = PropTypes.shape({
  label: PropTypes.string,
  targetStateId: PropTypes.string,
  execute: PropTypes.func.isRequired,
  isAvailable: PropTypes.func.isRequired,
  isDisabled: PropTypes.func.isRequired,
  inProgress: PropTypes.func.isRequired
});

export default class PublicationWidget extends React.Component {
  static propTypes = {
    status: PropTypes.string.isRequired,
    isSaving: PropTypes.bool.isRequired,
    updatedAt: PropTypes.string,
    revert: CommandPropType,
    primary: CommandPropType,
    secondary: PropTypes.arrayOf(CommandPropType.isRequired).isRequired
  };

  state = {
    isOpenDropdown: false
  };

  render() {
    const { primary, status, secondary, isSaving, updatedAt, revert } = this.props;
    const secondaryActionsDisabled = every(secondary || [], action => action.isDisabled());
    return (
      <div>
        <h2 className="entity-sidebar__heading">Status</h2>
        <PublicationStatus status={status} />
        <div className="entity-sidebar__state-select">
          <div className="publish-buttons-row">
            {status !== 'published' && primary && (
              <Button
                isFullWidth
                buttonType="positive"
                disabled={primary.isDisabled()}
                loading={primary.inProgress()}
                testId={`change-state-${primary.targetStateId}`}
                onClick={() => {
                  primary.execute();
                }}
                extraClassNames="primary-publish-button">
                {primary.label}
              </Button>
            )}
            <Dropdown
              extraClassNames="secondary-publish-button-wrapper"
              position="bottom-right"
              isOpen={this.state.isOpenDropdown}
              onClose={() => {
                this.setState({ isOpenDropdown: false });
              }}
              toggleElement={
                <Button
                  extraClassNames="secondary-publish-button"
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
                  secondary.map(action => (
                    <DropdownListItem
                      key={action.label}
                      testId={`change-state-${action.targetStateId}`}
                      onClick={() => {
                        action.execute();
                      }}>
                      {action.label}
                    </DropdownListItem>
                  ))}
              </DropdownList>
            </Dropdown>
          </div>
        </div>
        <div className="entity-sidebar__status-more">
          {updatedAt && (
            <div className="entity-sidebar__save-status">
              <i
                className={classNames('entity-sidebar__saving-spinner', {
                  'x--active': isSaving
                })}
              />
              <span className="entity-sidebar__last-saved">
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
      </div>
    );
  }
}
