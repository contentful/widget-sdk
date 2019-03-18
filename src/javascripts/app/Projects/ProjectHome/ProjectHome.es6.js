import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import {
  Typography,
  DisplayText,
  Heading,
  Paragraph,
  List,
  ListItem,
  Button
} from '@contentful/forma-36-react-components';

const styles = {
  container: css({
    width: '700px',
    margin: '0 auto',
    display: 'flex',
    marginTop: tokens.spacingL
  })
};

import Members from './Members.es6';
import Spaces from './Spaces.es6';

export default class ProjectHome extends React.Component {
  static propTypes = {
    project: PropTypes.object.isRequired,
    spaces: PropTypes.array.isRequired,
    members: PropTypes.array.isRequired
  };

  render() {
    const { project, spaces, members } = this.props;

    return (
      <div className="project-home">
        <div className="project-home__details">
          <DisplayText>{project.name}</DisplayText>
          <Paragraph>{project.description}</Paragraph>
        </div>
        <div className="project-home__relations">
          <Members memberIds={project.memberIds} />
          <Spaces spaceIds={project.spaceIds} />
        </div>
      </div>
    );
  }
}
