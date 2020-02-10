import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import { getUser } from 'access_control/OrganizationMembershipRepository';
import {
  TextLink,
  Notification,
  Heading,
  Button,
  Paragraph,
  CopyButton
} from '@contentful/forma-36-react-components';
import { css, keyframes } from 'emotion';
import Icon from 'ui/Components/Icon';
import AppEditor from './AppEditor';
import * as ManagementApiClient from './ManagementApiClient';
import StateLink from 'app/common/StateLink';
import AppInstallModal from './AppInstallModal';

const fadeIn = keyframes({
  from: {
    opacity: '0'
  },
  to: {
    opacity: '1'
  }
});

const styles = {
  title: css({
    display: 'flex',
    alignItems: 'center',
    paddingBottom: tokens.spacingL,
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    '& div:first-child': css({
      marginRight: tokens.spacingL
    }),
    '& div:last-child h1': css({
      marginBottom: tokens.spacingXs
    })
  }),
  copyButton: css({
    button: css({
      height: '20px',
      border: 'none',
      backgroundColor: 'transparent',
      transform: 'translateX(-10px)',
      opacity: '0',
      transition: `all ${tokens.transitionDurationDefault} ${tokens.transitionEasingCubicBezier}`,
      '&:hover': css({
        backgroundColor: 'transparent',
        border: 'none',
        opacity: '1',
        transform: 'translateX(0)'
      })
    })
  }),
  info: css({
    padding: `${tokens.spacingL} 0`,
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    '& p:first-child': css({
      marginBottom: tokens.spacing2Xs
    }),
    '& p b': css({
      color: tokens.colorTextMid,
      marginRight: tokens.spacing2Xs
    })
  }),
  appEditor: css({
    padding: `${tokens.spacingL} 0`
  }),
  formActions: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }),
  creator: css({
    animation: `${fadeIn} .2s ease`
  })
};

const sysIdStyle = css({
  display: 'flex',
  flexDirection: 'row',
  '& p': css({
    fontFamily: tokens.fontStackMonospace,
    fontSize: tokens.fontSizeS,
    color: tokens.colorTextMid
  }),
  [`&:hover .${styles.copyButton} button`]: css({
    opacity: '1',
    transform: 'translateX(0)'
  })
});

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
      redirect: false,
      creator: '',
      showInstallModal: false
    };
  }

  async componentDidMount() {
    const { definition } = this.props;

    const { firstName, lastName } = await getUser(
      ManagementApiClient.createOrgEndpointByDef(definition),
      definition.sys.createdBy.sys.id
    );

    this.setState({ creator: [firstName, lastName].join(' ') });
  }

  save = async () => {
    this.setState({ busy: true });

    try {
      const updated = await ManagementApiClient.save(this.state.definition);
      this.setState({ name: updated.name, definition: updated });
      Notification.success('App updated successfully.');
    } catch (err) {
      Notification.error(
        'Validation failed. Please check that you have provided a app Name and valid Source URL.'
      );
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

  openInstallModal = () => this.setState({ showInstallModal: true });
  closeInstallModal = () => this.setState({ showInstallModal: false });

  render() {
    const { redirect, name, definition, busy, showInstallModal } = this.state;

    return (
      <Workbench>
        <AppInstallModal
          definition={showInstallModal ? definition : null}
          onClose={this.closeInstallModal}
        />
        {redirect && <StateLink path="^.list">{({ onClick }) => onClick() || null}</StateLink>}
        <Workbench.Header
          title="App details"
          actions={
            <Button disabled={busy} onClick={this.openInstallModal}>
              Install to space
            </Button>
          }
          onBack={() => this.setState({ redirect: true })}></Workbench.Header>
        <Workbench.Content type="text">
          <div className={styles.title}>
            <div>
              <Icon name="page-apps" scale="1.6" />
            </div>
            <div>
              <Heading>{name}</Heading>
              <div className={sysIdStyle}>
                <Paragraph>{definition.sys.id}</Paragraph>
                <CopyButton className={styles.copyButton} copyValue={definition.sys.id} />
              </div>
            </div>
          </div>
          <div className={styles.info}>
            <Paragraph title={new Date(definition.sys.createdAt)}>
              <b>Created</b> {formatDate(definition.sys.createdAt)}
            </Paragraph>
            <Paragraph>
              <b>Created by</b>{' '}
              {this.state.creator && <span className={styles.creator}>{this.state.creator}</span>}
            </Paragraph>
          </div>
          <div className={styles.appEditor}>
            <AppEditor
              definition={definition}
              onChange={definition => this.setState({ definition })}
            />
          </div>
          <div className={styles.formActions}>
            <Button loading={busy} disabled={busy} onClick={this.save} testId="app-save">
              Update app
            </Button>
            <TextLink linkType="negative" disabled={busy} onClick={this.delete}>
              Delete {name}
            </TextLink>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}

AppDetails.propTypes = {
  definition: PropTypes.object.isRequired
};
