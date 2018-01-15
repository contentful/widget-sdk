import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {runTask} from 'utils/Concurrent';
import {createEndpoint as createOrgEndpoint} from 'access_control/OrganizationMembershipRepository';
import {getSpacesWithPlans} from 'account/pricing/PricingDataProvider';
import {href} from 'states/Navigator';
import svgPlus from 'svg/plus';
import {showDialog as showCreateSpaceModal} from 'services/CreateSpace';
import {canCreateSpaceInOrganization} from 'accessChecker';
import {getOrganization} from 'services/TokenStore';
import {isOwnerOrAdmin} from 'services/OrganizationRoles';
import * as ReloadNotification from 'ReloadNotification';
import {asReact} from 'ui/Framework/DOMRenderer';

const spacePlansPropTypes = {
  onReady: PropTypes.func.isRequired,
  onForbidden: PropTypes.func.isRequired,
  orgId: PropTypes.string.isRequired
};

const SpacePlans = createReactClass({
  getInitialState: function () {
    return {
      spaces: {items: []},
      canCreateSpace: false
    };
  },
  componentWillMount: function () {
    runTask(this.fetchData);
  },
  fetchData: function* () {
    const {orgId, onReady, onForbidden} = this.props;

    const org = yield getOrganization(orgId);
    if (!isOwnerOrAdmin(org)) {
      onForbidden();
      return;
    }

    const endpoint = createOrgEndpoint(orgId);
    const spaces = yield getSpacesWithPlans(endpoint)
      .catch(ReloadNotification.apiErrorHandler);

    onReady();
    const canCreateSpace = canCreateSpaceInOrganization(this.props.orgId);
    this.setState({spaces, canCreateSpace});
  },
  createSpace: function () {
    if (this.state.canCreateSpace) {
      showCreateSpaceModal(this.props.orgId);
    }
  },
  render: function () {
    const {spaces, canCreateSpace} = this.state;
    return h('div', {className: 'workbench'},
      h('div', {className: 'workbench-header__wrapper'},
        h('header', {className: 'workbench-header'},
          h('div', {className: 'workbench-header__icon'}), /* TODO missing icon */
          h('h1', {className: 'workbench-header__title'}, 'Spaces')
        )
      ),
      h('div', {className: 'workbench-main'},
        h('div', {className: 'workbench-main__content'},
          h(SpacesList, {spaces})
        ),
        h('div', {className: 'workbench-main__sidebar'},
          h(RightSidebar, {
            spaces,
            canCreateSpace,
            onCreateSpace: this.createSpace
          })
        )
      )
    );
  }
});

SpacePlans.propTypes = spacePlansPropTypes;

function SpacesList ({spaces}) {
  return h('div', {className: 'table'},
    h('div', {className: 'table__head'},
      h('table', null,
        h('thead', null,
          h('tr', null,
            h('th', null, 'Name'),
            h('th', null, 'Plan')
          )
        )
      )
    ),
    h('div', {className: 'table__body'},
      h('table', null,
        h('tbody', null,
          spaces.items.map(({sys, name, plan}) =>
            h('tr', {key: sys.id},
              h('td', null, h('a', {href: getSpaceLink(sys.id)}, name)),
              h('td', null, plan ? plan.name : 'Free')
            )
          )
        )
      )
    )
  );
}

function RightSidebar ({spaces, canCreateSpace, onCreateSpace}) {
  return h('div', {className: 'entity-sidebar'},
    h('h2', {className: 'entity-sidebar__heading'}, 'Add space'),
    h('p', {className: 'entity-sidebar__help-text'}, `Your organization has ${spaces.items.length} spaces.`),
    h('p', {className: 'entity-sidebar__help-text'},
      h('button', {
        className: 'btn-action x--block',
        onClick: onCreateSpace,
        disabled: !canCreateSpace
      },
        h('div', {className: 'btn-icon cf-icon cf-icon--plus inverted'}, asReact(svgPlus)),
        'Add space'
      )
    )
  );
}

function getSpaceLink (spaceId) {
  return href({path: ['spaces', 'detail'], params: {spaceId}});
}

export default SpacePlans;
