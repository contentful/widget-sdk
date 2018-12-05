import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import WebhookTemplateDialogTabs, { Tab, TabPane, TabsList } from './WebhookTemplateDialogTabs.es6';
import WebhookTemplateForm from './WebhookTemplateForm.es6';
import Templates from './templates/index.es6';

export default class WebhookTemplateDialog extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    templateId: PropTypes.string.isRequired,
    templateContentTypes: PropTypes.array.isRequired,
    hasAwsProxy: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired
  };

  renderTabs = ({ getTabProps, getPaneProps }) => {
    const { onClose, templateContentTypes, hasAwsProxy, onCreate } = this.props;

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
              onClose={onClose}
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
      <Modal size="800px" isShown={this.props.isShown} onClose={this.props.onClose}>
        {() => (
          <React.Fragment>
            <Modal.Header title="Webhook Templates" onClose={this.props.onClose} />
            <WebhookTemplateDialogTabs
              initialActive={this.props.templateId}
              renderTabs={this.renderTabs}
            />
          </React.Fragment>
        )}
      </Modal>
    );
  }
}
