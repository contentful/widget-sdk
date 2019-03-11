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

export default class ProjectHome extends React.Component {
  static propTypes = {
    project: PropTypes.object.isRequired,
    spaces: PropTypes.array.isRequired,
    members: PropTypes.array.isRequired
  };

  render() {
    const { project, spaces, members } = this.props;

    return (
      <div className={cx(styles.container)}>
        <Typography>
          <Button>Edit your project</Button>
          <DisplayText>{project.name}</DisplayText>
          <Paragraph>{project.description}</Paragraph>
          <Heading>Spaces</Heading>
          <Button>Edit spaces</Button>
          {spaces.length === 0 && <span>Add a space! DO IT!</span>}
          {spaces.length !== 0 && (
            <List>
              {spaces.map(space => (
                <ListItem key={space.sys.id}>{space.name}</ListItem>
              ))}
            </List>
          )}
          <Heading>Project members</Heading>
          <Button>Edit members</Button>
          {members.length === 0 && <span>Go ahead, add a project member!</span>}
          {members.length !== 0 && (
            <List>
              {members.map(member => (
                <ListItem key={member.sys.id}>
                  {member.firstName} {member.lastName}
                </ListItem>
              ))}
            </List>
          )}
        </Typography>
      </div>
    );
  }
}
