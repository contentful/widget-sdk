import React from 'react';
import PropTypes from 'prop-types';
import { Notification, Heading, Button } from '@contentful/forma-36-react-components';
import AppEditor from './AppEditor';
import * as ManagementApiClient from './ManagementApiClient';

export default class NewApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      definition: props.definition
    };
  }

  save = async () => {
    this.setState({ busy: true });

    try {
      const saved = await ManagementApiClient.save(this.state.definition);
      Notification.success('App created successfully.');
      this.props.goToDefinition(saved.sys.id);
    } catch (err) {
      Notification.error('Validation failed.');
    }

    this.setState({ busy: false });
  };

  render() {
    const { definition, busy } = this.state;

    return (
      <>
        <Heading>Add new app</Heading>

        <AppEditor definition={definition} onChange={definition => this.setState({ definition })} />

        <Button loading={busy} disabled={busy} onClick={this.save}>
          Save
        </Button>
      </>
    );
  }
}

NewApp.propTypes = {
  goToDefinition: PropTypes.func.isRequired,
  definition: PropTypes.object.isRequired
};
