import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import { Action } from 'data/CMA/EntityActions';
import Dialog from '../Dialog';
import { EntityType, getNumberOfLinks } from '../constants';
import FetchLinksToEntity, { RequestState } from '../FetchLinksToEntity';
import {
  onDialogOpen as trackDialogOpen,
  onDialogConfirm as trackDialogConfirm,
  onIncomingLinkClick as trackIncomingLinkClick,
  Origin as IncomingLinksOrigin
} from 'analytics/events/IncomingLinks';

import Loader from './Loader';
import IncomingLinksList from '../IncomingLinksList';
import IncomingLinksListError from '../IncomingLinksList/Error';
import messages from './messages';

const StateChangeConfirmation = createReactClass({
  propTypes: {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    action: PropTypes.oneOf([Action.Unpublish(), Action.Delete(), Action.Archive()]).isRequired,
    entityInfo: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf([EntityType.ASSET, EntityType.ENTRY])
    }),
    dialogSessionId: PropTypes.string.isRequired
  },
  handleClick({ linkEntityId, incomingLinksCount }) {
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
  },
  handleConfirm(incomingLinksCount) {
    const { action, dialogSessionId, entityInfo, onConfirm } = this.props;
    onConfirm();
    trackDialogConfirm({
      entityId: entityInfo.id,
      entityType: entityInfo.type,
      dialogAction: action,
      dialogSessionId,
      incomingLinksCount
    });
  },
  handleDialogOpen(incomingLinksCount) {
    const { action, dialogSessionId, entityInfo } = this.props;
    trackDialogOpen({
      entityId: entityInfo.id,
      entityType: entityInfo.type,
      dialogAction: action,
      dialogSessionId,
      incomingLinksCount
    });
  },
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
            <Dialog testId="state-change-confirmation-dialog">
              {requestState !== RequestState.PENDING && <Dialog.Header>{title}</Dialog.Header>}
              <Dialog.Body>
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
              </Dialog.Body>
              {requestState !== RequestState.PENDING && (
                <Dialog.Controls>
                  <button
                    className="btn-caution"
                    data-test-id="confirm"
                    onClick={() => {
                      this.handleConfirm(links.length);
                    }}>
                    {confirm}
                  </button>
                  <button className="btn-secondary-action" data-test-id="cancel" onClick={onCancel}>
                    Cancel
                  </button>
                </Dialog.Controls>
              )}
            </Dialog>
          );
        }}
      />
    );
  }
});

function getMessages({ action, entityInfo, links }) {
  const numberOfLinks = getNumberOfLinks(links);
  return messages[action][entityInfo.type][numberOfLinks];
}

export default StateChangeConfirmation;
