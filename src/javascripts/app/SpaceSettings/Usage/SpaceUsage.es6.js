import * as auth from 'Authentication';
import {apiUrl} from 'Config';
import {createOrganizationEndpoint} from 'data/Endpoint';
import {getSingleSpacePlan} from 'account/pricing/PricingDataProvider';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {createElement as h} from 'libs/react';
import {runTask} from 'utils/Concurrent';
import * as ReloadNotification from 'ReloadNotification';
import {TiersTable} from 'account/pricing/TiersTable';
import pageSettingsIcon from 'svg/page-settings';
import scaleSvg from 'utils/ScaleSvg';
import {asReact} from 'ui/Framework/DOMRenderer';

const SpaceUsage = createReactClass({
  getInitialState: function () {
    return {
      name: '',
      charges: [],
      empty: false
    };
  },
  componentDidMount: function () {
    return runTask(this.fetchPlan);
  },
  fetchPlan: function* () {
    const {orgId, spaceId} = this.props;
    const orgEndpoint = createOrganizationEndpoint(apiUrl(), orgId, auth);

    const plan = yield getSingleSpacePlan(orgEndpoint, spaceId)
      .catch(ReloadNotification.apiErrorHandler);

    if (plan) {
      this.setState({
        name: plan.name,
        charges: plan.ratePlanCharges
          // we only support tiered charges now
          .filter(charge => Array.isArray(charge.tiers))
      });
    } else {
      this.setState({empty: true});
    }
  },
  render: function () {
    const {name, charges, empty} = this.state;
    return h(Workbench, {
      title: 'Usage',
      icon: pageSettingsIcon,
      content: h('div', {style: {padding: '2rem 3.15rem'}},
        empty ? h('p', null, 'No charges available') : '',
        h('h2', {style: {margin: '0 0 1em'}}, name),
        charges.map(charge => h(TiersTable, {key: charge.sys.id, charge}))
      )
    });
  }
});

SpaceUsage.propTypes = {
  orgId: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired
};

// TODO: move this to Workbench.es6.js?
function Workbench ({title, icon, content, sidebar}) {
  return h('div', {
    className: 'workbench'
  },
    h('div', {
      className: 'workbench-header__wrapper'
    },
      h('header', {
        className: 'workbench-header'
      },
        icon && h('div', {className: 'workbench-header__icon cf-icon'}, asReact(scaleSvg(icon, 0.75))),
        h('h1', {
          className: 'workbench-header__title'
        }, title)
      )
    ),
    h('div', {
      className: 'workbench-main'
    },
      h('div', {
        className: 'workbench-main__content'
      }, content),
      h('div', {
        className: 'workbench-main__sidebar'
      }, sidebar)
    )
  );
}

export default SpaceUsage;
