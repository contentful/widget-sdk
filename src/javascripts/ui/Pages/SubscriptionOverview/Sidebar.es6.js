import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import {href} from 'states/Navigator';
import {byName as colors} from 'Styles/Colors';
import { billing, invoices } from 'ui/NavStates/Org';

import Icon from 'ui/Components/Icon';
import Price from 'ui/Components/Price';

import { hasAnySpacesInaccessible } from './utils';

function Sidebar ({grandTotal, spacePlans, orgId, isOrgOwner, isOrgBillable, onContactUs}) {
  // TODO - add these styles to stylesheets
  const iconStyle = {fill: colors.blueDarkest, paddingRight: '6px', position: 'relative', bottom: '-0.125em'};
  const anyInaccessibleSpaces = hasAnySpacesInaccessible(spacePlans);

  return <div className='entity-sidebar' data-test-id='subscription-page.sidebar'>
    { isOrgBillable &&
      <Fragment>
        <h2 className='entity-sidebar__heading'>Grand total</h2>
        <p data-test-id='subscription-page.sidebar.grand-total'>
          Your grand total is <Price value={grandTotal} style={{fontWeight: 'bold'}} /> per month.
        </p>
        {
          isOrgOwner &&
          <p style={{marginBottom: '28px'}}>
            <Icon name='invoice' style={iconStyle} />
            <a
              className='text-link'
              href={href(invoices(orgId))}
              data-test-id='subscription-page.sidebar.invoice-link'
            >
              View invoices
            </a>
          </p>
        }
        <div className='note-box--info'>
          <p>
            Note that the monthly invoice amount might deviate from the total shown above. This happens when you hit overages or make changes to your subscription during a billing cycle.
          </p>
          <p>
            <Icon name='invoice' style={iconStyle} />
            <a
              className='text-link'
              href={href(invoices(orgId))}
              data-test-id='subscription-page.sidebar.invoice-link'
            >
              View invoices
            </a>
          </p>
        </div>
      </Fragment>
    }
    {
      !isOrgBillable && isOrgOwner &&
      <Fragment>
        <h2 className='entity-sidebar__heading'>Your payment details</h2>
        <p>
          You need to provide us with your billing address and credit card details before creating paid spaces or adding users beyond the free limit.
        </p>
        <Icon name='invoice' style={iconStyle} />
        <a
          className='text-link'
          href={href(billing(orgId))}
          data-test-id='subscription-page.sidebar.add-payment-link'
        >
          Enter payment details
        </a>
      </Fragment>
    }
    { anyInaccessibleSpaces &&
      <Fragment>
        <h2 className='entity-sidebar__heading'>Spaces without permission</h2>
        <p>
          Some of your spaces are not accessible, which means you cannot view the content or usage of those spaces.
        </p>
        <p>
         However, since you&apos;re an organization {isOrgOwner ? 'owner' : 'admin'} you can grant yourself access by going to <i>users</i> and adding yourself to the space.
        </p>
      </Fragment>
    }
    <h2 className='entity-sidebar__heading'>Need help?</h2>
    <p>
      { isOrgBillable && 'Do you need to upgrade or downgrade your spaces?' }
      { !isOrgBillable && 'Do you have any questions about our pricing?' }
      <Fragment>&#32;Don&apos;t hesitate to talk to our customer success team.</Fragment>
    </p>
    <p>
      <Icon name='bubble' style={iconStyle} />
      <button
        className='text-link'
        onClick={onContactUs}
        data-test-id='subscription-page.sidebar.contact-link'
      >
        Get in touch with us
      </button>
    </p>
  </div>;
}

Sidebar.propTypes = {
  grandTotal: PropTypes.number.isRequired,
  orgId: PropTypes.string.isRequired,
  isOrgOwner: PropTypes.bool.isRequired,
  isOrgBillable: PropTypes.bool.isRequired,
  onContactUs: PropTypes.func.isRequired,
  spacePlans: PropTypes.array.isRequired
};

export default Sidebar;
