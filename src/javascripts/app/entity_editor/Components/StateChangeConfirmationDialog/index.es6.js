import React from 'libs/react';
import PropTypes from 'libs/prop-types';
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
    action: PropTypes.oneOf([
      Action.Unpublish(),
      Action.Delete(),
      Action.Archive()
    ]).isRequired,
    entityInfo: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf([
        EntityType.ASSET,
        EntityType.ENTRY
      ])
    }),
    sessionId: PropTypes.string.isRequired
  },
  handleClick ({ linkEntityId, incomingLinksCount }) {
    trackIncomingLinkClick({
      linkEntityId,
      origin: IncomingLinksOrigin.DIALOG,
      entityId: this.props.entityInfo.id,
      entityType: this.props.entityInfo.type,
      incomingLinksCount
    });
  },
  handleConfirm (incomingLinksCount) {
    this.props.onConfirm();
    const { sessionId, entityInfo } = this.props;
    trackDialogConfirm({
      sessionId,
      entityId: entityInfo.id,
      entityType: entityInfo.type,
      incomingLinksCount
    });
  },
  handleDialogOpen (incomingLinksCount) {
    const { sessionId, entityInfo } = this.props;
    trackDialogOpen({
      sessionId,
      entityId: entityInfo.id,
      entityType: entityInfo.type,
      incomingLinksCount
    });
  },
  render () {
    const { action, entityInfo, onCancel, sessionId } = this.props;

    return (
      <FetchLinksToEntity
        {...entityInfo}
        render={({ links, requestState }) => {
          const { title, body, confirm } = getMessages({
            action,
            entityInfo,
            links
          });

          return (
            <Dialog testId="state-change-confirmation-dialog">
              {
                requestState !== RequestState.PENDING &&
                  <Dialog.Header>{title}</Dialog.Header>
              }
              <Dialog.Body>
                {
                  requestState === RequestState.PENDING &&
                    <Loader />
                }
                {
                  requestState === RequestState.SUCCESS &&
                    <IncomingLinksList
                      origin={IncomingLinksOrigin.DIALOG}
                      entityId={entityInfo.id}
                      entityType={entityInfo.type}
                      links={links}
                      message={body}
                      sessionId={sessionId}
                      onClick={this.handleClick}
                      onComponentMount={function () {
                        this.handleDialogOpen(links.length);
                      }}
                    />
                }
                {
                  requestState === RequestState.ERROR &&
                    <IncomingLinksListError />
                }
              </Dialog.Body>
              {
                requestState !== RequestState.PENDING &&
                  <Dialog.Controls>
                    <button
                      className="btn-caution"
                      data-test-id="confirm"
                      onClick={function () {
                        this.handleConfirm(links.length);
                      }}>
                      {confirm}
                    </button>
                    <button
                      className="btn-secondary-action"
                      data-test-id="cancel"
                      onClick={onCancel}>
                      Cancel
                    </button>
                  </Dialog.Controls>
              }
            </Dialog>
          );
        }}
      />
    );
  }
});

function getMessages ({ action, entityInfo, links }) {
  const numberOfLinks = getNumberOfLinks(links);
  return messages[action][entityInfo.type][numberOfLinks];
}

export default StateChangeConfirmation;
