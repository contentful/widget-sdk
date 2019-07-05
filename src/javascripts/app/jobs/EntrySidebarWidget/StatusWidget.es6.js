import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { every } from 'lodash';
import { css } from 'emotion';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Icon,
  Tag
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import RelativeTimeData from 'components/shared/RelativeDateTime/index.es6';
import StatusBadge from './StatusBadge.es6';
import ActionRestrictedNote from './ActionRestrictedNote.es6';

import CommandPropType from 'app/entity_editor/CommandPropType.es6';

const styles = {
  scheduleListItem: css({
    lineHeight: '1rem',
    display: 'flex',
    alignItems: 'center'
  }),
  scheduledIcon: css({
    marginRight: tokens.spacing2Xs
  })
};

export default class StatusWidget extends React.PureComponent {
  static propTypes = {
    status: PropTypes.string.isRequired,
    isSaving: PropTypes.bool.isRequired,
    updatedAt: PropTypes.string,
    revert: CommandPropType,
    primary: CommandPropType,
    secondary: PropTypes.arrayOf(CommandPropType.isRequired).isRequired,
    onScheduledPublishClick: PropTypes.func.isRequired,
    isScheduledPublishDisabled: PropTypes.bool.isRequired,
    isDisabled: PropTypes.bool.isRequired
  };

  state = {
    isOpenDropdown: false
  };

  renderScheduledPublicationCta = () => {
    // disabled by the parent component (e.g. error during jobs fetching)
    if (this.props.isScheduledPublishDisabled) {
      return null;
    }

    // do not show cta if entity is published
    if (this.props.primary.targetStateId === 'published') {
      // primary action can be either publish or unachrive
      // TODO: revisit after support for sched. pub archived entries
      if (this.props.primary.isDisabled()) {
        return null;
      }
    }

    const canSchedule = this.props.status === 'draft' || this.props.status === 'changes';

    return (
      canSchedule && (
        <DropdownListItem
          className={styles.scheduleListItem}
          testId="schedule-publication"
          onClick={() => {
            this.props.onScheduledPublishClick();
            this.setState({ isOpenDropdown: false });
          }}>
          <div className={styles.scheduleListItem}>
            <Icon icon="Clock" color="muted" className={styles.scheduledIcon} />
            Schedule publication <Tag className="f36-margin-left--2xs">Alpha</Tag>
          </div>
        </DropdownListItem>
      )
    );
  };

  render() {
    const { primary, status, secondary, isSaving, updatedAt, revert, isDisabled } = this.props;
    const secondaryActionsDisabled = every(secondary || [], action => action.isDisabled());
    return (
      <div data-test-id="status-widget">
        <header className="entity-sidebar__header">
          <h2 className="entity-sidebar__heading">Status</h2>
        </header>
        <StatusBadge status={status} />
        <div className="entity-sidebar__state-select">
          <div className="publish-buttons-row">
            {status !== 'published' && primary && (
              <React.Fragment>
                <Button
                  isFullWidth
                  buttonType="positive"
                  disabled={primary.isDisabled() || isDisabled}
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
                  disabled={isDisabled || secondaryActionsDisabled}
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
                        this.setState({ isOpenDropdown: false });
                      }}>
                      {action.label}
                    </DropdownListItem>
                  ))}
                {this.renderScheduledPublicationCta()}
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
