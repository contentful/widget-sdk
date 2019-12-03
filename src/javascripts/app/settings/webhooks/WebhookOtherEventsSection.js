import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { isActionChecked, changeAction } from './WebhookSegmentationState';
import { Paragraph, CheckboxField } from '@contentful/forma-36-react-components';

export default class WebhookOtherEventsSection extends React.Component {
  static propTypes = {
    values: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  render() {
    const { values, onChange } = this.props;
    const otherEventEntityType = 'EnvironmentAlias';
    const otherEventEntityAction = 'change_target';

    return (
      <Fragment>
        <hr />
        <div data-test-id="other-events-section">
          <Paragraph>Other Events</Paragraph>
          <br />
          <CheckboxField
            id="environment-alias-action"
            labelText={'Environment Alias Target Change'}
            helpText={'This event is triggered when an environment alias targets a new environment'}
            checked={isActionChecked(values, otherEventEntityType, otherEventEntityAction)}
            onChange={e => {
              return onChange(
                changeAction(values, otherEventEntityType, otherEventEntityAction, e.target.checked)
              );
            }}
          />
        </div>
      </Fragment>
    );
  }
}
