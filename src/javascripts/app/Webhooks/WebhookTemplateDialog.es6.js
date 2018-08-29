import React from 'react';
import PropTypes from 'prop-types';
import WebhookTemplateDialogTabs, { Tab, TabPane, TabsList } from './WebhookTemplateDialogTabs';
import WebhookTemplateForm from './WebhookTemplateForm';
import Templates from './templates';

export default class WebhookTemplateDialog extends React.Component {
  static propTypes = {
    templateId: PropTypes.string.isRequired,
    webhookRepo: PropTypes.object.isRequired,
    templateContentTypes: PropTypes.array.isRequired,
    reposition: PropTypes.func.isRequired,
    closeDialog: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.renderTabs = this.renderTabs.bind(this);
  }

  renderTabs({ getTabProps, getPaneProps }) {
    const { closeDialog, webhookRepo, templateContentTypes } = this.props;
    return (
      <React.Fragment>
        <TabsList title="Templates">
          {Templates.map(template => (
            <Tab key={template.id} template={template} {...getTabProps(template.id)} />
          ))}
        </TabsList>
        {Templates.map(template => (
          <TabPane key={template.id} {...getPaneProps(template.id)}>
            <WebhookTemplateForm
              template={template}
              closeDialog={closeDialog}
              webhookRepo={webhookRepo}
              templateContentTypes={templateContentTypes}
            />
          </TabPane>
        ))}
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className="modal-dialog webhook-templates-dialog">
        <header className="modal-dialog__header">
          <h1>Webhook Templates</h1>
          <button className="modal-dialog__close" onClick={this.props.closeDialog} />
        </header>
        <WebhookTemplateDialogTabs
          initialActive={this.props.templateId}
          renderTabs={this.renderTabs}
          reposition={this.props.reposition}
        />
      </div>
    );
  }
}
