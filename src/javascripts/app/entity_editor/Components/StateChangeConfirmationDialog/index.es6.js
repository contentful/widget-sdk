import React from 'react';
import PropTypes from 'prop-types';
import { Action } from 'data/CMA/EntityActions.es6';
import { ModalConfirm } from '@contentful/forma-36-react-components';
import { EntityType, getNumberOfLinks } from '../constants.es6';
import FetchLinksToEntity, { RequestState } from '../FetchLinksToEntity/index.es6';
import {
  onDialogOpen as trackDialogOpen,
  onDialogConfirm as trackDialogConfirm,
  onIncomingLinkClick as trackIncomingLinkClick,
  Origin as IncomingLinksOrigin
} from 'analytics/events/IncomingLinks.es6';

import Loader from './Loader.es6';
import IncomingLinksList from '../IncomingLinksList/index.es6';
import IncomingLinksListError from '../IncomingLinksList/Error.es6';
import messages from './messages.es6';

class StateChangeConfirmation extends React.Component {
  static propTypes = {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    action: PropTypes.oneOf([Action.Unpublish(), Action.Delete(), Action.Archive()]).isRequired,
    entityInfo: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf([EntityType.ASSET, EntityType.ENTRY])
    }),
    dialogSessionId: PropTypes.string.isRequired
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
      dialogSessionId
    });
  };

  handleConfirm = incomingLinksCount => {
    const { action, dialogSessionId, entityInfo, onConfirm } = this.props;
    onConfirm();
    trackDialogConfirm({
      entityId: entityInfo.id,
      entityType: entityInfo.type,
      dialogAction: action,
      dialogSessionId,
      incomingLinksCount
    });
  };

  handleDialogOpen = incomingLinksCount => {
    const { action, dialogSessionId, entityInfo } = this.props;
    trackDialogOpen({
      entityId: entityInfo.id,
      entityType: entityInfo.type,
      dialogAction: action,
      dialogSessionId,
      incomingLinksCount
    });
  };

  render() {
    const { action, entityInfo, onCancel } = this.props;

    return (
      <FetchLinksToEntity
        {...entityInfo}
        origin={IncomingLinksOrigin.DIALOG}
        render={({ links, requestState }) => {
          const { title, body, confirm } = getMessages({
            action,
            entityInfo,
            links
          });

          return (
            <ModalConfirm
              isShown
              testId="state-change-confirmation-dialog"
              intent="negative"
              title={requestState !== RequestState.PENDING ? title : ''}
              onConfirm={() => this.handleConfirm(links.length)}
              confirmLabel={confirm}
              confirmTestId="confirm"
              onCancel={() => onCancel()}
              cancelTestId="cancel"
              isConfirmLoading={requestState === RequestState.PENDING}>
              {requestState === RequestState.PENDING && <Loader />}
              {requestState === RequestState.SUCCESS && (
                <IncomingLinksList
                  origin={IncomingLinksOrigin.DIALOG}
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
