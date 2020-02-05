import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon';
import tokens from '@contentful/forma-36-tokens';

import {
  Heading,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Paragraph,
  TextLink,
  Typography,
  CopyButton,
  SectionHeading
} from '@contentful/forma-36-react-components';

import StateLink from 'app/common/StateLink';

const styles = {
  headerActions: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginLeft: tokens.spacingXs
  }),
  headerInput: css({
    maxWidth: '1100px',
    width: '100%',
    marginLeft: tokens.spacing4Xl
  }),
  appActions: css({
    'button:first-child': css({
      marginRight: tokens.spacingS
    })
  }),
  copyButton: css({
    button: css({
      border: 'none',
      backgroundColor: 'transparent',
      '&:hover': css({
        backgroundColor: 'transparent',
        border: 'none'
      })
    })
  }),
  sidebarHeading: css({
    color: tokens.colorElementDarkest,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    fontWeight: tokens.fontWeightNormal
  }),
  cell: css({
    height: '40px',
    display: 'flex',
    alignItems: 'center'
  }),
  miniIcon: css({
    marginRight: tokens.spacingS,
    verticalAlign: 'sub'
  })
};

export default function AppListing({ definitions }) {
  if (definitions.length < 1) {
    return (
      <>
        <Heading>No apps found</Heading>
        <StateLink path="^.new_definition">
          {({ onClick }) => <Button onClick={onClick}>Create new</Button>}
        </StateLink>
      </>
    );
  }

  return (
    <Workbench>
      <Workbench.Header
        title={<Heading>Apps</Heading>}
        icon={<Icon name="page-apps" scale="1" />}
        actions={
          <StateLink path="^.new_definition">
            {({ onClick }) => <Button onClick={onClick}>Create new</Button>}
          </StateLink>
        }
      />
      <Workbench.Content>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>ID</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {definitions.map(def => {
              return (
                <TableRow key={def.sys.id}>
                  <TableCell>
                    <div className={styles.cell}>
                      <StateLink path="^.definitions" params={{ definitionId: def.sys.id }}>
                        <Icon name="page-apps" scale="0.5" className={styles.miniIcon} />{' '}
                        <b>{def.name}</b>
                      </StateLink>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={styles.cell}>
                      {def.sys.id}{' '}
                      <CopyButton className={styles.copyButton} copyValue={def.sys.id} />
                    </div>
                  </TableCell>
                  <TableCell className={styles.appActions} align="right">
                    <div className={styles.cell}>
                      <StateLink path="^.definitions" params={{ definitionId: def.sys.id }}>
                        {({ onClick }) => (
                          <Button buttonType="muted" onClick={onClick} size="small">
                            Install to space
                          </Button>
                        )}
                      </StateLink>
                      <StateLink path="^.definitions" params={{ definitionId: def.sys.id }}>
                        {({ onClick }) => (
                          <Button buttonType="muted" onClick={onClick} size="small">
                            Edit
                          </Button>
                        )}
                      </StateLink>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Workbench.Content>
      <Workbench.Sidebar position="right">
        <Typography>
          <SectionHeading className={styles.sidebarHeading}>About Apps</SectionHeading>
          <Paragraph>
            Build private apps for Contentful to extend the core functionality of the web app and
            optimize the workflow of editors.
          </Paragraph>
          <Paragraph>
            Learn more about{' '}
            <TextLink href="https://www.contentful.com/developers/docs/extensibility/apps/building-apps/">
              building Contentful apps
            </TextLink>{' '}
            or check out our{' '}
            <TextLink href="https://contentful.com/marketplace">Marketplace</TextLink>.
          </Paragraph>
        </Typography>
      </Workbench.Sidebar>
    </Workbench>
  );
}

AppListing.propTypes = {
  definitions: PropTypes.arrayOf(PropTypes.object).isRequired
};
