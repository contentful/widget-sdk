/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import moment from 'moment';

import { TextLink } from '@contentful/forma-36-react-components';
import SsoExemptionDialog from './SsoExemptionModal';
import ModalLauncher from 'app/common/ModalLauncher';
import { OrganizationMembership as OrganizationMembershipPropType } from 'app/OrganizationSettings/PropTypes';

export default class UserSsoInfo extends React.Component {
  static propTypes = {
    membership: OrganizationMembershipPropType.isRequired
  };

  showExemptionDialog = () => {
    ModalLauncher.open(({ onClose, isShown }) => (
      <SsoExemptionDialog isShown={isShown} onClose={onClose} membership={this.props.membership} />
    ));
  };

  render() {
    const { isExemptFromRestrictedMode, lastSignInAt } = this.props.membership.sys.sso;

    return (
      <dl className="definition-list">
        <dt>Last SSO login</dt>
        <dd>{lastSignInAt ? moment(lastSignInAt).format('dddd, MMMM Do YYYY') : 'Never'}</dd>
        <dt>Exempt from SSO</dt>
        <dd>
          {isExemptFromRestrictedMode ? (
            <span onClick={this.showExemptionDialog}>
              Yes -{' '}
              <TextLink linkType="secondary" style={{ verticalAlign: 'bottom' }}>
                See why
              </TextLink>
            </span>
          ) : (
            'No'
          )}
        </dd>
      </dl>
    );
  }
}
