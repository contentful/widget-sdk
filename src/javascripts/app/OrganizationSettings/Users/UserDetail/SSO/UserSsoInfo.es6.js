import React from 'react';
import moment from 'moment';

import { TextLink } from '@contentful/ui-component-library';
import SsoExemptionDialog from './SsoExemptionModal.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { OrganizationMembership as OrganizationMembershipPropType } from '../../PropTypes.es6';

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
