import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Icon } from '@contentful/forma-36-react-components';

import { OrganizationMembership as OrganizationMembershipPropType } from 'app/OrganizationSettings/PropTypes.es6';

export default class SseExemptionModal extends React.Component {
  static propTypes = {
    membership: OrganizationMembershipPropType.isRequired,
    onClose: PropTypes.func.isRequired,
    isShown: PropTypes.bool.isRequired
  };

  render() {
    const { membership, isShown, onClose } = this.props;
    const { exemptionReasons } = membership.sys.sso;
    const user = membership.sys.user;
    const exemptionReasonsMap = {
      userIsOwner: `The user is an owner of the organization`,
      userHasMultipleOrganizationMemberships: `The user belongs to more than one Contentful organization`,
      userIsManuallyExempt: `The user is explicitly marked as exempt from Restricted Mode`
    };
    const includesReason = reason => {
      return exemptionReasons.includes(reason);
    };

    return (
      <Modal isShown={isShown} onClose={onClose} title="SSO exemption">
        <div>
          <p>
            {`We can't enforce login via SSO on ${user.firstName ? user.firstName : user.email}`}.
          </p>
          <p>
            Users can continue logging into Contentful via email and third-party services even when{' '}
            <a
              href="https://www.contentful.com/faq/sso/#how-does-sso-restricted-mode-work"
              rel="noopener noreferrer"
              target="_blank">
              Restricted Mode
            </a>{' '}
            is enabled if they fall into one or more of the following conditions:
          </p>
          <ul style={{ marginBottom: 20 }}>
            {Object.keys(exemptionReasonsMap)
              .sort((a, b) => {
                return exemptionReasons.indexOf(b) - exemptionReasons.indexOf(a);
              })
              .map(reason => (
                <li key={reason} style={{ opacity: includesReason(reason) ? '1' : '0.5' }}>
                  • {exemptionReasonsMap[reason]}{' '}
                  {includesReason(reason) && (
                    <Icon
                      icon="CheckCircle"
                      color="positive"
                      style={{ verticalAlign: 'text-bottom' }}
                    />
                  )}
                </li>
              ))}
          </ul>
          <p>
            <a href="https://www.contentful.com/faq/sso/" rel="noopener noreferrer" target="_blank">
              Learn more about SSO in Contentful
            </a>
          </p>
        </div>
      </Modal>
    );
  }
}
