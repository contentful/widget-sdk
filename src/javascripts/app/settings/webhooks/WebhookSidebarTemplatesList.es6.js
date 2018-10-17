import React from 'react';
import PropTypes from 'prop-types';
import Templates from './templates';

const WebhookSidebarTemplatesList = ({ openTemplateDialog }) => (
  <React.Fragment>
    <h2 className="entity-sidebar__heading">Webhook Templates</h2>
    {Templates.slice(0, 5).map(template => (
      <div className="webhook-template-item" key={template.id}>
        <div className="webhook-template-item__logo">{template.logo}</div>
        <div className="webhook-template-item__title">
          <strong>{template.title}</strong>
          <small>{template.subtitle}</small>
        </div>
        <div className="webhook-template-item__action">
          <button
            className="btn-link"
            onClick={() => openTemplateDialog(template.id, 'webhook-view')}>
            Add
          </button>
        </div>
      </div>
    ))}
    <div className="webhook-template-item webhook-template-item__see-all">
      <button className="btn-link" onClick={() => openTemplateDialog(null, 'webhook-view')}>
        See all {Templates.length} templates
      </button>
    </div>
  </React.Fragment>
);

WebhookSidebarTemplatesList.propTypes = {
  openTemplateDialog: PropTypes.func.isRequired
};

export default WebhookSidebarTemplatesList;
