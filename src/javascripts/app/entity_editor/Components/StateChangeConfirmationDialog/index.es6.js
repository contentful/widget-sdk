import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';
import { Action } from 'data/CMA/EntityActions';
import Dialog from '../Dialog';
import { EntityType, getNumberOfLinks } from '../constants';
import FetchLinksToEntity, { RequestState } from '../FetchLinksToEntity';

import Loader from './Loader';
import IncomingLinksList from '../IncomingLinksList';
import IncomingLinksListError from '../IncomingLinksList/Error';
import messages from './messages';

const StateChangeConfirmation = createReactClass({
  displayName: 'StateChangeConfirmation',
  render () {
    const { action, entityInfo, onConfirm, onCancel } = this.props;

    return h(FetchLinksToEntity, {
      id: entityInfo.id,
      type: entityInfo.type,
      render: ({ links, requestState }) => {
        const actionMessages = getMessages({ action, entityInfo, links });

        return h(
          Dialog,
          {
            testId: 'state-change-confirmation-dialog'
          },
          requestState !== RequestState.PENDING &&
            h(Dialog.Header, null, actionMessages.title),
          h(
            Dialog.Body,
            null,
            requestState === RequestState.PENDING && h(Loader),
            requestState === RequestState.SUCCESS &&
              h(IncomingLinksList, { links, message: actionMessages.body }),
            requestState === RequestState.ERROR && h(IncomingLinksListError)
          ),
          requestState !== RequestState.PENDING &&
            h(
              Dialog.Controls,
              null,
              h(
                'button',
                {
                  className: 'btn-caution',
                  'data-test-id': 'confirm',
                  onClick: onConfirm
                },
                actionMessages.confirm
              ),
              h(
                'button',
                {
                  className: 'btn-secondary-action',
                  'data-test-id': 'cancel',
                  onClick: onCancel
                },
                'Cancel'
              )
            )
        );
      }
    });
  }
});

function getMessages ({ action, entityInfo, links }) {
  const numberOfLinks = getNumberOfLinks(links);
  return messages[action][entityInfo.type][numberOfLinks];
}

StateChangeConfirmation.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  action: PropTypes.oneOf([
    Action.Unpublish(),
    Action.Delete(),
    Action.Archive()
  ]).isRequired,
  entityInfo: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.oneOf([EntityType.ASSET, EntityType.ENTRY])
  })
};

export default StateChangeConfirmation;
