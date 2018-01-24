import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';
import { Action } from 'data/CMA/EntityActions';
import Dialog from './Dialog';
import Loader from './Loader';
import Links from './Links';
import Error from './Error';
import messages from './Messages';
import { EntityType, RequestState, getNumberOfLinks } from './constants';

const StateChangeConfirmation = createReactClass({
  displayName: 'StateChangeConfirmation',
  render () {
    const {
      action,
      entityInfo,
      links,
      onConfirm,
      onCancel,
      requestState
    } = this.props;
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
          h(Links, { links, message: actionMessages.body }),
        requestState === RequestState.ERROR && h(Error)
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
  links: PropTypes.array.isRequired,
  requestState: PropTypes.oneOf([
    RequestState.SUCCESS,
    RequestState.PENDING,
    RequestState.ERROR
  ]).isRequired,
  entityInfo: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.oneOf([EntityType.ASSET, EntityType.ENTRY])
  })
};

export default StateChangeConfirmation;
