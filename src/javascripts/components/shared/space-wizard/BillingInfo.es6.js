import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

import { TextLink } from '@contentful/ui-component-library';

const BillingInfo = createReactClass({
  propTypes: {
    canSetupBilling: PropTypes.bool.isRequired,
    goToBilling: PropTypes.func.isRequired,
    action: PropTypes.string.isRequired
  },
  render: function() {
    const { canSetupBilling, goToBilling, action } = this.props;

    return (
      <div className="note-box--info create-space-wizard__info">
        {canSetupBilling && (
          <p>
            <span>
              <TextLink onClick={goToBilling}>Add payment details</TextLink> for the
              organization&#32;
            </span>
            {action === 'create' && 'before creating a paid space.'}
            {action === 'change' && 'before changing a space.'}
          </p>
        )}
        {!canSetupBilling && (
          <p>
            <span>
              The owner of this organization needs to add payment details before you can&#32;
            </span>
            {action === 'create' && 'create a paid space.'}
            {action === 'change' && 'change a space.'}
          </p>
        )}
      </div>
    );
  }
});

export default BillingInfo;
