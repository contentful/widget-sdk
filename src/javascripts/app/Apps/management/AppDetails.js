import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import { Notification, Heading, Button, Paragraph } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import Icon from 'ui/Components/Icon';
import AppEditor from './AppEditor';
import * as ManagementApiClient from './ManagementApiClient';

const styles = {
  title: css({
    display: 'flex',
    alignItems: 'center',
    paddingBottom: tokens.spacingS,
    borderBottom: `2px solid ${tokens.colorElementMid}`,
    '& div:first-child': css({
      marginRight: tokens.spacingL
    })
  })
};

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
      <Workbench>
        <Workbench.Header title="App details" onBack={() => {}}></Workbench.Header>
        <Workbench.Content type="text">
          <div className={styles.title}>
            <div>
              <Icon name="page-apps" scale="2" />
            </div>
            <div>
              <Heading>{name}</Heading>
              <Paragraph>{this.props.definition.sys.id}</Paragraph>
            </div>
          </div>
          <Heading>App details</Heading>
          <Button loading={busy} disabled={busy} onClick={this.save}>
            Save
          </Button>
          <AppEditor
            definition={definition}
            onChange={definition => this.setState({ definition })}
          />
        </Workbench.Content>
      </Workbench>
    );
  }
}

AppDetails.propTypes = {
  definition: PropTypes.object.isRequired
};
