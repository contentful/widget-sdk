import React from 'react';
import PropTypes from 'prop-types';
import { Notification, Heading, Button, Paragraph } from '@contentful/forma-36-react-components';
import AppEditor from './AppEditor';
import * as ManagementApiClient from './ManagementApiClient';

export default class AppDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      name: props.definition.name,
      definition: props.definition
    };
  }

  save = async () => {
    this.setState({ busy: true });

    try {
      const updated = await ManagementApiClient.save(this.state.definition);
      this.setState({ name: updated.name, definition: updated });
      Notification.success('App updated successfully.');
    } catch (err) {
      Notification.error('Validation failed.');
    }

    this.setState({ busy: false });
  };

  render() {
    const { name, definition, busy } = this.state;

    return (
      <>
        <Heading>App details</Heading>
        <Heading>{name}</Heading>
        <Paragraph>{this.props.definition.sys.id}</Paragraph>
        <Button loading={busy} disabled={busy} onClick={this.save}>
          Save
        </Button>
        <AppEditor definition={definition} onChange={definition => this.setState({ definition })} />
      </>
    );
  }
}

AppDetails.propTypes = {
  definition: PropTypes.object.isRequired
};
