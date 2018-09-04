import React from 'react';
import PropTypes from 'prop-types';
import WebhookTemplateDialogTabs, { Tab, TabPane, TabsList } from './WebhookTemplateDialogTabs.es6';
import WebhookTemplateForm from './WebhookTemplateForm.es6';
import Templates from './templates';
import { getStore } from 'TheStore';

const store = getStore('session').forKey('premiumWebhookTemplatesEnabled');

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
    this.templates = Templates;

    // Code below is for early access of premium (enterprise)
    // templates. If you open the app with a deeplink to a premium
    // template you'll get the full list up until the end of the
    // current session.
    const isInitialPremium = this.templates.find(t => {
      return t.id === props.templateId && t.premium;
    });

    if (isInitialPremium || store.get() === 'yes') {
      store.set('yes');
    } else {
      this.templates = this.templates.filter(t => !t.premium);
    }
  }

  renderTabs = ({ getTabProps, getPaneProps }) => {
    const { closeDialog, webhookRepo, templateContentTypes } = this.props;

    return (
      <React.Fragment>
        <TabsList title={`Templates (${this.templates.length})`}>
          {this.templates.map(template => (
            <Tab key={template.id} template={template} {...getTabProps(template.id)} />
          ))}
        </TabsList>
        {this.templates.map(template => (
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
