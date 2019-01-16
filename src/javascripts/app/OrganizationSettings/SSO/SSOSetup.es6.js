import React from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/common/Workbench.es6';
import IDPSetupForm from './IDPSetupForm.es6';
import { Button } from '@contentful/forma-36-react-components';

export default class SSOSetupForm extends React.Component {
  static propTypes = {
    org: {
      name: PropTypes.string.isRequired
    },
    idpDetails: {
      ssoName: PropTypes.string,
      ssoProvider: PropTypes.string,
      ssoIdpTargetUrl: PropTypes.string,
      idpCert: PropTypes.string
    }
  };
  state = {
    idpDetails: null
  };

  componentDidMount() {
    const { idpDetails } = this.props;

    this.setState({
      idpDetails
    });
  }

  createIdp() {
    // This will call the API
    this.setState({
      idpDetails: {}
    });
  }

  render() {
    const { org } = this.props;
    const { idpDetails } = this.state;

    return (
      <Workbench className="sso-setup">
        <Workbench.Header>
          <Workbench.Title>Single Sign-On (SSO)</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content>
          <div className="sso-setup__main">
            <div>
              <h1>Set up Single Sign-On (SSO)</h1>
              <p className="f36-font-size--l f36-line-height--default">
                Set up SSO for your organization in Contentful in a couple of steps. If you need
                help with the setup, view our documentation on the process, and if you have any
                questions, talk to support.
              </p>
              {!idpDetails && (
                <Button buttonType="primary" onClick={() => this.createIdp()}>
                  Set up SSO
                </Button>
              )}
              {idpDetails && <IDPSetupForm org={org} idpDetails={idpDetails} />}
            </div>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}
