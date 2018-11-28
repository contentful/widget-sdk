import React from 'react';

import { TextLink } from '@contentful/forma-36-react-components';

export default class EnterpriseSpaceWizardInfo extends React.Component {
  state = {
    showingMore: false
  };

  getToggleLabel() {
    return this.state.showingMore ? 'Show less' : 'Show more';
  }

  toggleText() {
    this.setState({ showingMore: !this.state.showingMore });
  }

  onLearnMore() {
    window.open(
      'https://www.contentful.com/pricing/?faq_category=payments&faq=what-is-a-proof-of-concept-poc-space#what-is-a-proof-of-concept-poc-space'
    );
  }

  render() {
    return (
      <section style={{ marginBottom: '30px' }}>
        <p className="enterprise-space-wizard__info" style={{ display: 'inline' }}>
          {`Use a proof of concept space to experiment or start new projects. Talk to us when you decide to launch. `}
        </p>
        {this.state.showingMore && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ marginBottom: '20px' }}>
              {`A proof of concept space is free of charge until you decide to use it for a live application.
                We can then help you to convert it to a regular production space.`}
            </p>
            <p style={{ marginBottom: '20px' }}>
              {`Proof of concept spaces share the same limits for API requests and asset bandwidth with the
                other spaces in your organization. `}
              <TextLink onClick={() => this.onLearnMore()}>Learn more</TextLink>
            </p>
          </div>
        )}
        <TextLink onClick={() => this.toggleText()}>{this.getToggleLabel()}</TextLink>
      </section>
    );
  }
}
