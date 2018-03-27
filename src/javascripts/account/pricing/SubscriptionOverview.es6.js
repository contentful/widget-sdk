import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {runTask} from 'utils/Concurrent';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getPlansWithSpaces} from 'account/pricing/PricingDataProvider';
import * as Intercom from 'intercom';
import {getSpaces, getOrganization} from 'services/TokenStore';
import {isOwnerOrAdmin, isOwner} from 'services/OrganizationRoles';
import * as ReloadNotification from 'ReloadNotification';
import {href} from 'states/Navigator';
import {showDialog as showCreateSpaceModal} from 'services/CreateSpace';
import {openDeleteSpaceDialog} from 'services/DeleteSpace';
import moment from 'moment';
import {get, isString} from 'lodash';
import {supportUrl} from 'Config';
import $location from '$location';
import Workbench from 'app/WorkbenchReact';
import Tooltip from 'ui/Components/Tooltip';
import {joinAnd} from 'stringUtils';
import {byName as colors} from 'Styles/Colors';
import QuestionMarkIcon from 'svg/QuestionMarkIcon';
import BubbleIcon from 'svg/bubble';
import InvoiceIcon from 'svg/invoice';
import {asReact} from 'ui/Framework/DOMRenderer';

const SubscriptionOverview = createReactClass({
  propTypes: {
    onReady: PropTypes.func.isRequired,
    onForbidden: PropTypes.func.isRequired,
    orgId: PropTypes.string.isRequired
  },
  getInitialState: function () {
    return {
      basePlan: {},
      spacePlans: [],
      grandTotal: 0
    };
  },
  componentWillMount: function () {
    runTask(this.fetchData);
  },
  fetchData: function* () {
    const {orgId, onReady, onForbidden} = this.props;

    const organization = yield getOrganization(orgId);
    if (!isOwnerOrAdmin(organization)) {
      onForbidden();
      return;
    }

    const endpoint = createOrganizationEndpoint(orgId);
    const plans = yield getPlansWithSpaces(endpoint).catch(ReloadNotification.apiErrorHandler);
    const accessibleSpaces = yield getSpaces(); // spaces that current user has access to

    onReady();

    const basePlan = plans.items.find(({planType}) => planType === 'base');
    const spacePlans = plans.items
      .filter(({planType}) => planType === 'space')
      .sort((plan1, plan2) => {
        const [name1, name2] = [plan1, plan2].map((plan) => get(plan, 'space.name', ''));
        return name1.localeCompare(name2);
      })
      // Set space.isAccessible to check if current user can go to space details.
      .map((plan) => {
        if (plan.space) {
          plan.space.isAccessible = !!accessibleSpaces.find((space) => space.sys.id === plan.space.sys.id);
        }
        return plan;
      });

    // TODO add user fees
    const grandTotal = calculateTotalPrice(plans.items);

    this.setState({basePlan, spacePlans, grandTotal, organization});
  },
  createSpace: function () {
    showCreateSpaceModal(this.props.orgId);
  },
  deleteSpace: function (space) {
    openDeleteSpaceDialog({
      space,
      onSuccess: () => { runTask(this.fetchData); }
    });
  },
  contactUs: function () {
    // Open intercom if it's possible, otherwise go to support page.
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      $location.url(supportUrl);
    }
  },
  render: function () {
    const {basePlan, spacePlans, grandTotal, organization} = this.state;
    const {orgId} = this.props;

    return h(Workbench, {
      title: 'Subscription',
      icon: 'subscription',
      testId: 'subscription-page',
      content: h('div', {
        style: {padding: '0 2rem'}
      },
          h(BasePlan, {basePlan}),
          h(SpacePlans, {
            spacePlans,
            onCreateSpace: this.createSpace,
            onDeleteSpace: this.deleteSpace,
            isOrgOwner: isOwner(organization)
          })
        ),
      sidebar: h(RightSidebar, {
        orgId,
        grandTotal,
        onContactUs: this.contactUs
      })
    });
  }
});

function BasePlan ({basePlan}) {
  const enabledFeaturesNames = getEnabledFeatures(basePlan).map(({name}) => name);

  return h('div', {style: {margin: '1em 0 3em'}},
    h('h2', {
      className: 'section-title'
    }, null, 'Platform'),
    h('p', {
      'data-test-id': 'subscription-page.base-plan-details'
    },
      h('b', null, basePlan.name),
      enabledFeaturesNames.length
        ? ` – includes ${joinAnd(enabledFeaturesNames)}.`
        : ' – doesn’t include any additional features.'
    )
  );
}

function SpacePlans ({spacePlans, onCreateSpace, onDeleteSpace, isOrgOwner}) {
  if (!spacePlans.length) {
    return h('div', {
      'data-test-id': 'subscription-page.no-spaces'
    },
      h('h2', {
        className: 'section-title'
      }, null, 'Spaces'),
      h('p', null,
        'Your organization doesn\'t have any spaces. ',
        h('button', {
          className: 'btn-link',
          onClick: onCreateSpace
        }, 'Add space')
      )
    );
  } else {
    const spacesTotal = calculateTotalPrice(spacePlans);

    return h('div', null,
      h('h2', {
        className: 'section-title'
      }, null, 'Spaces'),
      h('p', {
        style: {marginBottom: '2em'},
        'data-test-id': 'subscription-page.spaces-total'
      }, null,
        'The total for your ',
        h('b', null, `${spacePlans.length} spaces`),
        ' is ',
        h(Price, {value: spacesTotal, style: {fontWeight: 'bold'}}),
        ' per month.'
        // TODO show available free spaces
      ),
      h('table', {
        className: 'simple-table',
        'data-test-id': 'subscription-page.spaces-list'
      },
        h('thead', null,
          h('tr', null,
            h('th', {style: {width: '25%'}}, 'Name'),
            h('th', {style: {width: '30%'}}, 'Space type / price'),
            h('th', {style: {width: '10%'}}, 'Created by'),
            h('th', {style: {width: '10%'}}, 'Created on'),
            h('th', {style: {width: '25%'}}, 'Actions')
          )
        ),
        h('tbody', {className: 'clickable'}, spacePlans.map(
          (plan) => h(SpacePlanRow, {
            key: plan.sys.id || (plan.space && plan.space.sys.id),
            plan,
            onDeleteSpace,
            isOrgOwner
          })
        ))
      )
    );
  }
}

function SpacePlanRow ({plan, onDeleteSpace, isOrgOwner}) {
  const space = plan.space;
  const enabledFeatures = getEnabledFeatures(plan);
  let actionLinks = [];
  let createdBy = '';
  let createdAt = '';

  if (space) {
    createdBy = getUserName(space.sys.createdBy || {});
    createdAt = moment.utc(space.sys.createdAt).format('DD/MM/YYYY');
    actionLinks = getSpaceActionLinks(space, isOrgOwner, onDeleteSpace);
  }

  const featuresTooltip = enabledFeatures.length
  ? 'This space type includes ' + joinAnd(enabledFeatures.map(({name}) => name))
  : 'This space type doesn’t include any additional features';

  const questionMarkIcon = h('span', {
    style: {
      position: 'relative',
      bottom: '1px'
    }
  }, asReact(QuestionMarkIcon({color: colors.textLight})));

  return h('tr', null,
    h('td', {
      'data-test-id': 'subscription-page.spaces-list.space-name'
    }, h('strong', {style: {margin: 0}}, get(space, 'name', '—'))),
    h('td', {
      'data-test-id': 'subscription-page.spaces-list.space-plan'
    },
      h('strong', {style: {marginTop: 0}},
        plan.name
      ),
      h(Tooltip, {
        element: questionMarkIcon,
        tooltip: featuresTooltip,
        options: {width: 200},
        style: {display: 'inline', marginLeft: '6px'}
      }),
      h('br'),
      h(Price, {value: plan.price, unit: 'month'})
    ),
    h('td', null, createdBy),
    h('td', null, createdAt),
    h('td', null, ...actionLinks)
  );
}

function RightSidebar ({grandTotal, orgId, onContactUs}) {
  // TODO - add these styles to stylesheets
  const iconStyle = {fill: colors.blueDarkest, paddingRight: '6px', position: 'relative', bottom: '-0.125em'};

  return h('div', {
    className: 'entity-sidebar',
    'data-test-id': 'subscription-page.sidebar'
  },
    h('h2', {className: 'entity-sidebar__heading'}, 'Grand total'),
    h('p', {
      'data-test-id': 'subscription-page.sidebar.grand-total'
    },
      'Your grand total is ',
      h(Price, {value: grandTotal, style: {fontWeight: 'bold'}}),
      ' per month.'
    ),
    h('p', {
      style: {marginBottom: '28px'}
    },
      h('span', {style: iconStyle}, asReact(InvoiceIcon)),
      h('a', {
        className: 'text-link',
        href: href(getInvoiceNavState(orgId)),
        'data-test-id': 'subscription-page.sidebar.invoice-link'
      }, 'View invoices')
    ),
    h('div', {className: 'note-box--info'},
      h('p', null,
        'Note that the monthly invoice amount might deviate from the total shown ' +
        'above. This happens when you hit overages or make changes to your ' +
        'subscription during a billing cycle.'
      )
    ),
    h('h2', {className: 'entity-sidebar__heading'}, 'Need help?'),
    h('p', null,
      'Do you need to up- or downgrade your spaces? Don’t hesitate to talk to our customer success team.'),
    h('p', {className: 'entity-sidebar__help-text'},
      h('span', {style: iconStyle}, asReact(BubbleIcon)),
      h('button', {
        className: 'text-link',
        onClick: onContactUs,
        'data-test-id': 'subscription-page.sidebar.contact-link'
      }, 'Get in touch with us')
    )
  );
}

function getSpaceActionLinks (space, isOrgOwner, onDeleteSpace) {
  const actionLinkStyle = {padding: '0 10px 0 0', display: 'inline', whiteSpace: 'nowrap'};

  let spaceLink = '';
  if (space.isAccessible) {
    spaceLink = h('a', {
      className: 'text-link',
      href: href(getSpaceNavState(space.sys.id)),
      style: actionLinkStyle,
      'data-test-id': 'subscription-page.spaces-list.space-link'
    }, 'Go to space');
  } else {
    spaceLink = h(Tooltip, {
      element: h('button', {
        className: 'text-link',
        disabled: true,
        'data-test-id': 'subscription-page.spaces-list.space-link'
      }, 'Go to space'),
      tooltip: h('div', {style: {whiteSpace: 'normal'}},
        'You don’t have access to this space. But since you’re an organization ',
        `${isOrgOwner ? 'owner' : 'admin'} you can grant yourself access by going to `,
        h('i', null, 'users'),
        ' and adding yourself to the space.'
      ),
      options: {width: 400},
      style: actionLinkStyle
    });
  }
  const usageLink = h('a', {
    className: 'text-link',
    href: href(getSpaceUsageNavState(space.sys.id)),
    style: actionLinkStyle,
    'data-test-id': 'subscription-page.spaces-list.space-usage-link'
  }, 'Usage');
  const deleteLink = h('button', {
    className: 'text-link text-link--destructive',
    style: actionLinkStyle,
    onClick: () => onDeleteSpace(space),
    'data-test-id': 'subscription-page.spaces-list.delete-space-link'
  }, 'Delete');

  return [spaceLink, usageLink, deleteLink];
}

function Price ({value = 0, currency = '$', unit = null, style = null}) {
  const valueStr = parseInt(value, 10).toLocaleString('en-US');
  const unitStr = unit && ` /${unit}`;
  return h('span', {style}, [currency, valueStr, unitStr].join(''));
}

function calculateTotalPrice (subscriptionPlans) {
  return subscriptionPlans.reduce(
    (total, plan) => total + (parseInt(plan.price, 10) || 0),
    0
  );
}

function getEnabledFeatures ({ratePlanCharges = []}) {
  return ratePlanCharges.filter(({unitType}) => unitType === 'feature');
}

function getSpaceNavState (spaceId) {
  return {
    path: ['spaces', 'detail', 'home'],
    params: {spaceId},
    options: { reload: true }
  };
}

function getSpaceUsageNavState (spaceId) {
  return {
    path: ['spaces', 'detail', 'settings', 'usage'],
    params: {spaceId},
    options: { reload: true }
  };
}

function getInvoiceNavState (orgId) {
  return {
    path: ['account', 'organizations', 'billing'],
    params: {orgId},
    options: { reload: true }
  };
}

function getUserName ({firstName, lastName, email}) {
  const name = (firstName || lastName) ? `${firstName} ${lastName}` : email;
  return isString(name) ? name.trim() : '';
}

export default SubscriptionOverview;
