import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { Tabs } from './WebhookTemplateDialogTabs';
import { WebhookTemplateForm } from './WebhookTemplateForm';
import { WebhookTemplates } from './templates';

export class WebhookTemplateDialog extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    templateId: PropTypes.string.isRequired,
    templateContentTypes: PropTypes.array.isRequired,
    hasAwsProxy: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
  };

  renderTabs = ({ getTabProps, getPaneProps }) => {
    const { onClose, templateContentTypes, hasAwsProxy, onCreate } = this.props;

    return (
      <React.Fragment>
        <Tabs.TabsList title={`Templates (${WebhookTemplates.length})`}>
          {WebhookTemplates.map((template) => (
            <Tabs.Tab key={template.id} template={template} {...getTabProps(template.id)} />
          ))}
        </Tabs.TabsList>
        {WebhookTemplates.map((template) => (
          <Tabs.TabPane key={template.id} {...getPaneProps(template.id)}>
            <WebhookTemplateForm
              template={template}
              onClose={onClose}
              templateContentTypes={templateContentTypes}
              hasAwsProxy={hasAwsProxy}
              onCreate={onCreate}
            />
          </Tabs.TabPane>
        ))}
      </React.Fragment>
    );
  };

  render() {
    return (
      <Modal size="800px" isShown={this.props.isShown} onClose={this.props.onClose}>
        {() => (
          <React.Fragment>
            <Modal.Header title="Webhook Templates" onClose={this.props.onClose} />
            <Tabs initialActive={this.props.templateId} renderTabs={this.renderTabs} />
          </React.Fragment>
        )}
      </Modal>
    );
  }
}
