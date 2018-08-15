import React from 'react';
import PropTypes from 'prop-types';
import modalDialog from 'modalDialog';
import Templates from './templates';

export function openTemplateDialog (templateId, webhookRepo, templateContentTypes) {
  modalDialog.open({
    ignoreEsc: true,
    backgroundClose: false,
    template:
      '<react-component class="modal-background" name="app/Webhooks/WebhookTemplateDialog" props="props" />',
    controller: $scope => {
      $scope.props = {
        templateId,
        webhookRepo,
        templateContentTypes,
        reposition: () => $scope.$emit('centerOn:reposition'),
        closeDialog: () => $scope.dialog.confirm()
      };
    }
  });
}

const WebhookSidebarTemplatesList = ({ webhookRepo, templateContentTypes }) => (
  <React.Fragment>
    <h2 className="entity-sidebar__heading">Webhook Templates</h2>
    {Templates.map(template => (
      <div className="webhook-template-item" key={template.id}>
        <div className="webhook-template-item__logo">
          {template.logo}
        </div>
        <div className="webhook-template-item__title">
          <strong>{template.title}</strong>
          <small>{template.subtitle}</small>
        </div>
        <div className="webhook-template-item__action">
          <button
            className="btn-link"
            onClick={() => openTemplateDialog(template.id, webhookRepo, templateContentTypes)}
          >
            Add
          </button>
        </div>
      </div>
    ))}
  </React.Fragment>
);

WebhookSidebarTemplatesList.propTypes = {
  webhookRepo: PropTypes.object.isRequired,
  templateContentTypes: PropTypes.array.isRequired
};

export default WebhookSidebarTemplatesList;
