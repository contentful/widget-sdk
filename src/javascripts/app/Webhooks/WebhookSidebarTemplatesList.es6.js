import React from 'react';
import PropTypes from 'prop-types';
import Templates from './templates';

const WebhookSidebarTemplatesList = ({ webhookRepo, templateContentTypes, openTemplateDialog }) => (
  <React.Fragment>
    <h2 className="entity-sidebar__heading">Webhook Templates</h2>
    {Templates.map(template => (
      <div className="webhook-template-item" key={template.id}>
        <div className="webhook-template-item__logo">{template.logo}</div>
        <div className="webhook-template-item__title">
          <strong>{template.title}</strong>
          <small>{template.subtitle}</small>
        </div>
        <div className="webhook-template-item__action">
          <button
            className="btn-link"
            onClick={() => openTemplateDialog(template.id, webhookRepo, templateContentTypes)}>
            Add
          </button>
        </div>
      </div>
    ))}
  </React.Fragment>
);

WebhookSidebarTemplatesList.propTypes = {
  webhookRepo: PropTypes.object.isRequired,
  templateContentTypes: PropTypes.array.isRequired,
  openTemplateDialog: PropTypes.func.isRequired
};

export default WebhookSidebarTemplatesList;
