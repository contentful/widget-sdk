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
  TextInput,
  Paragraph,
  TextLink,
  Typography
} from '@contentful/forma-36-react-components';

import StateLink from 'app/common/StateLink';

const styles = {
  actions: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginLeft: tokens.spacingXs
  }),
  actionsInput: css({
    maxWidth: '1100px',
    width: '100%',
    marginLeft: tokens.spacing4Xl
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
          <div className={styles.actions}>
            <div className={styles.actionsInput}>
              <TextInput placeholder="Search by app name or ID" onChange={() => {}} />
            </div>
            <div>
              <StateLink path="^.new_definition">
                {({ onClick }) => <Button onClick={onClick}>Create new</Button>}
              </StateLink>
            </div>
          </div>
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
                  <TableCell>{def.name}</TableCell>
                  <TableCell>{def.sys.id}</TableCell>
                  <TableCell>
                    <StateLink path="^.definitions" params={{ definitionId: def.sys.id }}>
                      {({ onClick }) => (
                        <Button buttonType="muted" onClick={onClick}>
                          Install to space
                        </Button>
                      )}
                    </StateLink>
                    <StateLink path="^.definitions" params={{ definitionId: def.sys.id }}>
                      {({ onClick }) => (
                        <Button buttonType="muted" onClick={onClick}>
                          Edit
                        </Button>
                      )}
                    </StateLink>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Workbench.Content>
      <Workbench.Sidebar position="right">
        <Typography>
          About Apps
          <Paragraph>
            Build private apps for Contentful to extend the core functionality of the web app and
            optimize the workflow of editors.
          </Paragraph>
          <Paragraph>
            Learn more about <TextLink href="">building Contentful apps</TextLink> or check out our{' '}
            <TextLink href="">Marketplace</TextLink>.
          </Paragraph>
        </Typography>
      </Workbench.Sidebar>
    </Workbench>
  );
}

AppListing.propTypes = {
  definitions: PropTypes.arrayOf(PropTypes.object).isRequired
};
