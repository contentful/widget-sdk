import React from 'react';
import PropTypes from 'prop-types';
import { Action } from 'data/CMA/EntityActions';
import { ModalConfirm } from '@contentful/forma-36-react-components';
import { EntityType, getNumberOfLinks } from '../constants';
import FetchLinksToEntity, { RequestState } from '../FetchLinksToEntity';
import {
  onDialogOpen as trackDialogOpen,
  onDialogConfirm as trackDialogConfirm,
  onIncomingLinkClick as trackIncomingLinkClick,
  Origin as IncomingLinksOrigin,
} from 'analytics/events/IncomingLinks';

import Loader from './Loader';
import IncomingLinksList from '../IncomingLinksList';
import IncomingLinksListError from '../IncomingLinksList/Error';
import messages from './messages';

class StateChangeConfirmation extends React.Component {
  static propTypes = {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onArchive: PropTypes.func.isRequired,
    action: PropTypes.oneOf([Action.Unpublish(), Action.Delete(), Action.Archive()]).isRequired,
    entityInfo: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf([EntityType.ASSET, EntityType.ENTRY]),
    }),
    dialogSessionId: PropTypes.string.isRequired,
    isShown: PropTypes.bool,
  };

  handleClick = ({ linkEntityId, incomingLinksCount }) => {
    const { dialogSessionId, action: dialogAction } = this.props;
    trackIncomingLinkClick({
      linkEntityId,
      origin: IncomingLinksOrigin.DIALOG,
      entityId: this.props.entityInfo.id,
      entityType: this.props.entityInfo.type,
      incomingLinksCount,
      dialogAction,
      dialogSessionId,
    });
  };

  handleConfirm = (incomingLinksCount) => {
    const { action, dialogSessionId, entityInfo, onConfirm } = this.props;
    onConfirm();
    trackDialogConfirm({
      entityId: entityInfo.id,
      entityType: entityInfo.type,
      dialogAction: action,
      dialogSessionId,
      incomingLinksCount,
    });
  };

  handleDialogOpen = (incomingLinksCount) => {
    const { action, dialogSessionId, entityInfo } = this.props;
    trackDialogOpen({
      entityId: entityInfo.id,
      entityType: entityInfo.type,
      dialogAction: action,
      dialogSessionId,
      incomingLinksCount,
    });
  };

  handleDialogArchive = (incomingLinksCount) => {
    const { dialogSessionId, entityInfo, onArchive } = this.props;
    onArchive();
    trackDialogConfirm({
      entityId: entityInfo.id,
      entityType: entityInfo.type,
      dialogAction: Action.Archive(),
      dialogSessionId,
      incomingLinksCount,
    });
  };

  render() {
    const { action, entityInfo, onCancel, isShown } = this.props;

    return (
      <FetchLinksToEntity
        {...entityInfo}
        render={({ links, requestState }) => {
          const { title, body, confirm, secondary } = getMessages({
            action,
            entityInfo,
            links,
          });

          return (
            <ModalConfirm
              isShown={isShown}
              testId="state-change-confirmation-dialog"
              intent="negative"
              size="large"
              title={requestState !== RequestState.PENDING ? title : ''}
              onConfirm={() => this.handleConfirm(links.length)}
              confirmLabel={confirm}
              confirmTestId="confirm"
              onSecondary={() => this.handleDialogArchive(links.length)}
              secondaryLabel={secondary}
              secondaryIntent="muted"
              secondaryTestId="archive"
              onCancel={() => onCancel()}
              cancelTestId="cancel"
              isConfirmLoading={requestState === RequestState.PENDING}
              isSecondaryLoading={requestState === RequestState.PENDING}>
              {requestState === RequestState.PENDING && <Loader />}
              {requestState === RequestState.SUCCESS && (
                <IncomingLinksList
                  entityId={entityInfo.id}
                  entityType={entityInfo.type}
                  links={links}
                  message={body}
                  onClick={this.handleClick}
                  onComponentMount={() => {
                    this.handleDialogOpen(links.length);
                  }}
                />
              )}
              {requestState === RequestState.ERROR && <IncomingLinksListError />}
            </ModalConfirm>
          );
        }}
      />
    );
  }
}

function getMessages({ action, entityInfo, links }) {
  const numberOfLinks = getNumberOfLinks(links);
  return messages[action][entityInfo.type][numberOfLinks];
}

export default StateChangeConfirmation;
