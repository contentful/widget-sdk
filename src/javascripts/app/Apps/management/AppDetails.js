import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import { Notification, Heading, Button, Paragraph } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import Icon from 'ui/Components/Icon';
import AppEditor from './AppEditor';
import * as ManagementApiClient from './ManagementApiClient';
import StateLink from 'app/common/StateLink';

const styles = {
  title: css({
    display: 'flex',
    alignItems: 'center',
    paddingBottom: tokens.spacingL,
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    '& div:first-child': css({
      marginRight: tokens.spacingL
    })
  }),
  info: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingL} 0`,
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    '& div:first-child p:first-child': css({
      marginBottom: tokens.spacingXs
    }),
    '& div:last-child button:first-child': css({
      marginRight: tokens.spacingXs
    })
  }),
  appEditor: css({
    padding: `${tokens.spacingL} 0`
  })
};

function formatDate(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export default class AppDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      name: props.definition.name,
      definition: props.definition,
      redirect: false
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

  delete = async () => {
    this.setState({ busy: true });

    try {
      // TODO: Hook this logic up to the modal
      // await ManagementApiClient.deleteDef(this.state.definition);
      Notification.success(`${this.state.definition.name} was deleted!`);
      this.setState({ redirect: true });
    } catch (err) {
      Notification.error('App failed to delete. Please try again');
      this.setState({ busy: false });
    }
  };

  render() {
    const { redirect, name, definition, busy } = this.state;

    if (redirect) {
      return <StateLink path="^.list">{({ onClick }) => onClick() || null}</StateLink>;
    }

    return (
      <Workbench>
        <Workbench.Header
          title="App details"
          onBack={() => this.setState({ redirect: true })}></Workbench.Header>
        <Workbench.Content type="text">
          <div className={styles.title}>
            <div>
              <Icon name="page-apps" scale="2" />
            </div>
            <div>
              <Heading>{name}</Heading>
              <Paragraph>{definition.sys.id}</Paragraph>
            </div>
          </div>
          <div className={styles.info}>
            <div>
              <Paragraph>Created at: {formatDate(definition.sys.createdAt)}</Paragraph>
              <Paragraph>Created by: {definition.sys.createdBy.sys.id}</Paragraph>
            </div>
            <div>
              <Button loading={busy} disabled={busy} onClick={this.save}>
                Install to space
              </Button>
              <Button loading={busy} disabled={busy} onClick={this.delete} buttonType="negative">
                Delete
              </Button>
            </div>
          </div>
          <div className={styles.appEditor}>
            <AppEditor
              definition={definition}
              onChange={definition => this.setState({ definition })}
            />
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}

AppDetails.propTypes = {
  definition: PropTypes.object.isRequired
};
