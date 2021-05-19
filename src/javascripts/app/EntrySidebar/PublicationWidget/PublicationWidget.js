import React from 'react';
import PropTypes from 'prop-types';
import { every } from 'lodash';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Icon,
  Paragraph,
  Spinner,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import EntrySidebarWidget from '../EntrySidebarWidget';
import RelativeTimeData from 'components/shared/RelativeDateTime';
import CommandPropType from 'app/entity_editor/CommandPropType';
import StatusBadge from './StatusBadge';

const styles = {
  actionRestrictionNote: css({
    color: tokens.colorTextLight,
    marginTop: tokens.spacingXs,
  }),
  resetRightBorder: css({
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  }),
  resetLeftBorder: css({
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
  }),
};

const ActionRestrictedNote = ({ actionName, reason }) => (
  <Paragraph className={styles.actionRestrictionNote} data-test-id="action-restriction-note">
    <Icon icon="Lock" color="muted" className="action-restricted__icon" />
    {reason ? reason : `You do not have permission to ${actionName.toLowerCase()}`}
  </Paragraph>
);

ActionRestrictedNote.propTypes = {
  actionName: PropTypes.string,
  reason: PropTypes.string,
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
  actionName: PropTypes.string.isRequired,
};

export default class PublicationWidget extends React.PureComponent {
  static propTypes = {
    status: PropTypes.string.isRequired,
    isSaving: PropTypes.bool.isRequired,
    updatedAt: PropTypes.string,
    primary: CommandPropType,
    secondary: PropTypes.arrayOf(CommandPropType.isRequired).isRequired,
    publicationBlockedReason: PropTypes.string,
  };

  state = {
    isOpenDropdown: false,
  };

  render() {
    const { primary, status, secondary, isSaving, updatedAt, publicationBlockedReason } =
      this.props;
    const secondaryActionsDisabled = every(secondary || [], (action) => action.isDisabled());
    const isPrimaryPublishBlocked =
      primary && primary.targetStateId === 'published' && !!publicationBlockedReason;

    const hasPrimaryButton = status !== 'published' && primary;

    return (
      <EntrySidebarWidget title="Status">
        <StatusBadge status={status} />
        <div className="entity-sidebar__state-select">
          <div className="publish-buttons-row">
            {hasPrimaryButton && (
              <Button
                isFullWidth
                buttonType="positive"
                disabled={primary.isDisabled() || isPrimaryPublishBlocked}
                loading={primary.inProgress()}
                data-test-type="primary-publishing-button"
                testId={`change-state-${primary.targetStateId}`}
                onClick={() => {
                  primary.execute();
                }}
                className={styles.resetRightBorder}>
                {primary.label}
              </Button>
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
                  className={hasPrimaryButton ? styles.resetLeftBorder : ''}
                  isFullWidth
                  disabled={secondaryActionsDisabled}
                  testId="change-state-menu-trigger"
                  buttonType="positive"
                  indicateDropdown
                  onClick={() => {
                    this.setState((state) => ({ isOpenDropdown: !state.isOpenDropdown }));
                  }}>
                  {status === 'published' ? 'Change status' : ''}
                </Button>
              }>
              <DropdownList testId="change-state-menu">
                <DropdownListItem isTitle>Change status to</DropdownListItem>
                {secondary &&
                  secondary.map(
                    (action) =>
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
          {primary && primary.isRestricted() ? (
            <ActionRestrictedNote actionName={primary.label} />
          ) : (
            isPrimaryPublishBlocked && <ActionRestrictedNote reason={publicationBlockedReason} />
          )}
        </div>
        <div className="entity-sidebar__status-more">
          {updatedAt && (
            <div className="entity-sidebar__save-status">
              <span className="entity-sidebar__last-saved" data-test-id="last-saved">
                {isSaving ? (
                  <>
                    Saving <Spinner size="small" />
                  </>
                ) : (
                  <>
                    Last saved <RelativeTimeData value={updatedAt} />
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </EntrySidebarWidget>
    );
  }
}
