import React from 'react';
import PropTypes from 'prop-types';

import { TextLink } from '@contentful/ui-component-library';

class BillingInfo extends React.Component {
  static propTypes = {
    canSetupBilling: PropTypes.bool.isRequired,
    goToBilling: PropTypes.func.isRequired,
    action: PropTypes.string.isRequired
  };

  render() {
    const { canSetupBilling, goToBilling, action } = this.props;

    return (
      <div className="note-box--info create-space-wizard__info">
        {canSetupBilling && (
          <p>
            <span>
              <TextLink onClick={goToBilling}>Add payment details</TextLink> for the organization
            </span>{' '}
            {action === 'create' && 'before creating a paid space.'}
            {action === 'change' && 'before changing a space.'}
          </p>
        )}
        {!canSetupBilling && (
          <p>
            <span>The owner of this organization needs to add payment details before you can</span>{' '}
            {action === 'create' && 'create a paid space.'}
            {action === 'change' && 'change a space.'}
          </p>
        )}
      </div>
    );
  }
}

export default BillingInfo;
