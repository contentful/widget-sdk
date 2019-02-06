import React, { Component } from 'react';
import { Subheading, SectionHeading } from '@contentful/forma-36-react-components';
import AvailableItem from './AvailableItem.es6';
import { WidgetTypes } from '../constants.es6';

export default class AvailableItems extends Component {
  render() {
    return (
      <div>
        <Subheading extraClassNames="f36-margin-bottom--m">Available items</Subheading>
        <SectionHeading extraClassNames="f36-margin-bottom--xs">Built-in</SectionHeading>
        <div className="sidebar-configuraiton__available-items-section f36-margin-bottom--l">
          <AvailableItem title="Status" type={WidgetTypes.builtin} />
        </div>
        <SectionHeading extraClassNames="f36-margin-bottom--xs">UI Extensions</SectionHeading>
        <div className="sidebar-configuraiton__available-items-section f36-margin-bottom--l">
          <AvailableItem title="Netlify Extensions" type={WidgetTypes.extension} />
          <AvailableItem title="Your crazy extension" type={WidgetTypes.extension} />
        </div>
      </div>
    );
  }
}
