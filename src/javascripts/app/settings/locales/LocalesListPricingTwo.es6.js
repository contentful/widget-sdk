import React from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/common/Workbench.es6';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';
import LocalesListSidebar from './LocalesListSidebar.es6';
import LocalesTable from './LocalesTable.es6';

class LocalesListPricingTwo extends React.Component {
  static propTypes = {
    locales: PropTypes.arrayOf(PropTypes.object).isRequired,
    canChangeSpace: PropTypes.bool.isRequired,
    localeResource: PropTypes.object.isRequired,
    insideMasterEnv: PropTypes.bool.isRequired,
    subscriptionState: PropTypes.object.isRequired,
    upgradeSpace: PropTypes.func.isRequired
  };

  renderTitle() {
    return (
      <React.Fragment>
        Locales
        <span className="workbench-header__kb-link">
          <KnowledgeBase target="locale" />
        </span>
      </React.Fragment>
    );
  }

  render() {
    return (
      <Workbench className="locale-list entity-list">
        <Workbench.Header>
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>{this.renderTitle()}</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content>
          <LocalesTable locales={this.props.locales} />
        </Workbench.Content>
        <Workbench.Sidebar>
          <LocalesListSidebar
            insideMasterEnv={this.props.insideMasterEnv}
            localeResource={this.props.localeResource}
            canChangeSpace={this.props.canChangeSpace}
            subscriptionState={this.props.subscriptionState}
            upgradeSpace={this.props.upgradeSpace}
          />
        </Workbench.Sidebar>
      </Workbench>
    );
  }
}

export default LocalesListPricingTwo;
