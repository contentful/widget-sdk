import React from 'react';
import PropTypes from 'prop-types';
import WebhookTemplateDialogTabs, { Tab, TabPane, TabsList } from './WebhookTemplateDialogTabs.es6';
import WebhookTemplateForm from './WebhookTemplateForm.es6';
import Templates from './templates';

export default class WebhookTemplateDialog extends React.Component {
  static propTypes = {
    templateId: PropTypes.string.isRequired,
    templateContentTypes: PropTypes.array.isRequired,
    hasAwsProxy: PropTypes.bool.isRequired,
    reposition: PropTypes.func.isRequired,
    closeDialog: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired
  };

  renderTabs = ({ getTabProps, getPaneProps }) => {
    const { closeDialog, templateContentTypes, hasAwsProxy, onCreate } = this.props;

    return (
      <React.Fragment>
        <TabsList title={`Templates (${Templates.length})`}>
          {Templates.map(template => (
            <Tab key={template.id} template={template} {...getTabProps(template.id)} />
          ))}
        </TabsList>
        {Templates.map(template => (
          <TabPane key={template.id} {...getPaneProps(template.id)}>
            <WebhookTemplateForm
              template={template}
              closeDialog={closeDialog}
              templateContentTypes={templateContentTypes}
              hasAwsProxy={hasAwsProxy}
              onCreate={onCreate}
            />
          </TabPane>
        ))}
      </React.Fragment>
    );
  };

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
