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
  Button,
  TextInput,
  Textarea
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
    project: PropTypes.object.isRequired
  };

  render() {
    const { project } = this.props;

    return (
      <div className="project-home">
        <div className="project-home__details">
          <h2>{project.name}</h2>
          <TextInput value={project.name} />
          <Textarea value={project.description} />
        </div>
        <div className="project-home__relations">
          <Members projectMemberIds={project.memberIds} />
          <Spaces projectSpaceIds={project.spaceIds} />
        </div>
      </div>
    );
  }
}
