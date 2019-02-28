import React from 'react';
import PropTypes from 'prop-types';

import { DisplayText, Paragraph } from '@contentful/forma-36-react-components';

export default class ProjectHome extends React.Component {
  static propTypes = {
    project: PropTypes.object.isRequired
  };

  render() {
    const { project } = this.props;

    return (
      <div>
        <DisplayText>{project.name}</DisplayText>
        <Paragraph>{project.description}</Paragraph>
      </div>
    );
  }
}
