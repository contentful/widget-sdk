import React from 'react';
import { track } from 'analytics/Analytics.es6';
import { getModule } from 'NgRegistry.es6';

const $state = getModule('$state');
const Intercom = getModule('intercom');

const prefix = 'space-home-page-contact-us';

export default class extends React.Component {
  onClick = () => {
    track('element:click', {
      elementId: 'contact_sales_spacehome',
      groupId: 'contact_sales',
      fromState: $state.current.name
    });

    Intercom.open();
  };

  render() {
    return (
      <div className={`${prefix}__container`}>
        <div>
          <h3 className={`${prefix}__title`}>A fast setup for your project</h3>
          <div className={`${prefix}__description`}>
            Most projects launch faster when they receive advice from our experts.
          </div>
          <div>
            <span className="button btn-action" onClick={this.onClick}>
              Contact an expert
            </span>
          </div>
        </div>
        <div className={`${prefix}__img`} />
      </div>
    );
  }
}
