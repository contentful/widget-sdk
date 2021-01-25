import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';
import { WebhookTemplates } from './templates';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';

export const WebhookSidebarTemplatesList = ({ openTemplateDialog }) => (
  <WorkbenchSidebarItem title="Webhook Templates">
    {WebhookTemplates.slice(0, 5).map((template) => (
      <div className="webhook-template-item" key={template.id}>
        <div className="webhook-template-item__logo">{template.logo}</div>
        <div className="webhook-template-item__title">
          <strong>{template.title}</strong>
          <small>{template.subtitle}</small>
        </div>
        <div className="webhook-template-item__action">
          <Button
            size="small"
            buttonType="muted"
            onClick={() => openTemplateDialog(template.id, 'webhook-view')}>
            Add
          </Button>
        </div>
      </div>
    ))}
    <div className="webhook-template-item webhook-template-item__see-all">
      <Button
        size="small"
        buttonType="muted"
        onClick={() => openTemplateDialog(null, 'webhook-view')}>
        See all {WebhookTemplates.length} templates
      </Button>
    </div>
  </WorkbenchSidebarItem>
);

WebhookSidebarTemplatesList.propTypes = {
  openTemplateDialog: PropTypes.func.isRequired,
};
