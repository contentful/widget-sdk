import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dropdown,
  DropdownList,
  Button,
  Paragraph,
  Typography,
  Subheading,
  Note,
  TextLink,
  SkeletonContainer,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { DocsLink, LinkOpen } from 'ui/Content.es6';
import * as Auth from 'Authentication.es6';
import * as Config from 'Config.es6';
import * as TokenResourceManager from './TokenResourceManager';

import Paginator from 'ui/Components/Paginator.es6';
import { useTokensState } from './CMATokensViewReducer';

const styles = {
  pageSection: css({
    marginBottom: tokens.spacing2Xl
  }),
  tableWrapper: css({
    position: 'relative',
    minHeight: '6em',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL
  }),
  nameCell: css({
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis'
  }),
  actionCell: css({
    width: '7em',
    textAlign: 'right'
  }),
  revokeDropdown: css({
    padding: tokens.spacingXl,
    width: 350,
    textAlign: 'center'
  }),
  revokeButton: css({
    margin: tokens.spacingM,
    marginBottom: 0
  })
};

export function CMATokensView() {
  const tokenResourceManager = TokenResourceManager.create(Auth);
  const [state, actions] = useTokensState(tokenResourceManager);
  return <PageComponent state={state} actions={actions} />;
}

function PageComponent({ state, actions }) {
  return (
    <React.Fragment>
      <OauthSection />
      <PATSection state={state} actions={actions} />
    </React.Fragment>
  );
}

PageComponent.propTypes = {
  state: PropTypes.object,
  actions: PropTypes.object
};

function PATSection({ state, actions }) {
  return (
    <div className={styles.pageSection}>
      <Typography>
        <Subheading element="h2">Personal Access Tokens</Subheading>
        <Paragraph>
          As an alternative to OAuth applications, you can also leverage Personal Access Tokens to
          use the Content Management API. These tokens are always bound to your individual account,
          with the same permissions you have on all of your spaces and organizations.
        </Paragraph>
      </Typography>
      <div>
        <Button testId="pat.create.open" onClick={() => actions.OpenCreateDialog()}>
          Generate personal token
        </Button>
      </div>
      <TokenList state={state} actions={actions} />
    </div>
  );
}

PATSection.propTypes = {
  state: PropTypes.object,
  actions: PropTypes.object
};

function OauthSection() {
  return (
    <div className={styles.pageSection}>
      <Typography>
        <Subheading element="h2">OAuth tokens</Subheading>
        <Paragraph>
          OAuth tokens are issued by OAuth applications and represent the user who granted access
          through this application. These tokens have the same rights as the owner of the account.
          You can{' '}
          <DocsLink
            text="learn more about OAuth applications in our documentation"
            target="createOAuthApp"
          />
        </Paragraph>
      </Typography>
    </div>
  );
}

/**
 * Template for the token table and the pagination
 *
 * Also includes the error note box when fetching the tokens failed and
 * the loader.
 */
function TokenList({ state, actions }) {
  const { loadingTokens, loadingTokensError, tokens, currentPage, totalPages } = state;

  if (loadingTokensError) {
    return (
      <Note noteType="warning">
        The list of tokens failed to load, try refreshing the page. If the problem persists{' '}
        <LinkOpen key="contact-support-link" url={Config.supportUrl}>
          contact support
        </LinkOpen>
      </Note>
    );
  }

  return (
    <div data-test-id="pat.list">
      <div className={styles.tableWrapper}>
        {loadingTokens && (
          <SkeletonContainer
            clipId="loading-tokens"
            ariaLabel="Loading..."
            svgWidth="100%"
            svgHeight={120}>
            <SkeletonBodyText numberOfLines={5} />
          </SkeletonContainer>
        )}
        <TokenTable tokens={tokens} revoke={actions.Revoke} />
      </div>
      <Paginator select={actions.SelectPage} page={currentPage} pageCount={totalPages} />
    </div>
  );
}

TokenList.propTypes = {
  state: PropTypes.object,
  actions: PropTypes.object
};

function TokenTable({ tokens, revoke }) {
  if (tokens.length === 0) {
    return <div />;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell> </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tokens.map(token => (
          <TableRow key={token.id} testId={`pat.tokenRow.${token.id}`}>
            <TableCell className={styles.nameCell}>{token.name}</TableCell>
            <TableCell className={styles.actionCell}>
              <RevokeButton revoke={revoke} token={token} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

TokenTable.propTypes = {
  tokens: PropTypes.arrayOf(PropTypes.object).isRequired,
  revoke: PropTypes.func.isRequired
};

function RevokeButton({ revoke, token }) {
  const [isOpen, setOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      position="bottom-right"
      toggleElement={
        <TextLink linkType="negative" onClick={() => setOpen(!isOpen)} testId="pat.revoke.request">
          Revoke
        </TextLink>
      }>
      <DropdownList className={styles.revokeDropdown}>
        <Paragraph>
          This token won’t be available anymore, any application using it might break. Do you
          confirm?
        </Paragraph>
        <Button
          testId="pat.revoke.confirm"
          onClick={() => {
            revoke(token);
            setOpen(false);
          }}
          className={styles.revokeButton}
          buttonType="negative">
          Revoke
        </Button>
        <Button
          className={styles.revokeButton}
          buttonType="muted"
          onClick={() => {
            setOpen(false);
          }}>
          Cancel
        </Button>
      </DropdownList>
    </Dropdown>
  );
}

RevokeButton.propTypes = {
  revoke: PropTypes.func.isRequired,
  token: PropTypes.object.isRequired
};
