import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { assign } from 'lodash';
import { createSlot, Success, Failure } from 'utils/Concurrent.es6';
import { truncate } from 'utils/StringUtils.es6';
import { makeCtor, match } from 'utils/TaggedValues.es6';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Notification,
  Dropdown,
  DropdownList,
  Button,
  Paragraph,
  Typography,
  Subheading,
  Note,
  TextLink
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { createStore, bindActions, makeReducer } from 'ui/Framework/Store.es6';
import escape from 'utils/escape.es6';
import { DocsLink, LinkOpen } from 'ui/Content.es6';

import * as Config from 'Config.es6';
import * as ResourceManager from './Resource.es6';
import { openGenerateTokenDialog } from './GenerateCMATokenDialog.es6';
import { track } from 'analytics/Analytics.es6';

import Paginator from 'ui/Components/Paginator.es6';

// Number of tokens to fetch and show per page
const PER_PAGE = 10;

// Actions
const SelectPage = makeCtor('SelectPage');
const Revoke = makeCtor('Revoke');
const Reload = makeCtor('Reload');
const OpenCreateDialog = makeCtor('OpenCreateDialog');
const ReceiveResponse = makeCtor('ReceiveResponse');

const styles = {
  page: css({
    padding: tokens.spacingXl
  }),
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

export function initController($scope, auth) {
  // TODO This hack is unfortunate. But until we come up with a better
  // way to write components with side effects it is necessary.
  /* eslint-disable no-use-before-define */
  const tokenResourceManager = ResourceManager.create(auth);

  const initialState = {
    tokens: [],
    currentPage: 0,
    totalPages: 0
  };

  // Request slot for updating the list.
  const putRequest = createSlot(result => {
    store.dispatch(ReceiveResponse, result);
  });

  const reduce = makeReducer({
    [SelectPage]: selectPage,
    [Reload]: state => {
      return selectPage(state, state.currentPage);
    },
    [Revoke]: (state, token) => {
      const id = token.id;
      tokenResourceManager.revoke(id).then(
        () => {
          track('personal_access_token:action', { action: 'revoke', patId: id });
          Notification.success(
            `The token “${escape(truncate(token.name, 30))}” has been successfully revoked.`
          );
          actions.Reload();
        },
        () => {
          Notification.error(
            'Revoking failed, please try again. If the problem persists, contact support.'
          );
        }
      );
      return state;
    },
    [OpenCreateDialog]: state => {
      openGenerateTokenDialog(tokenResourceManager.create, actions.Reload);
      return state;
    },
    [ReceiveResponse]: (state, result) =>
      match(result, {
        [Success]: ({ total, items }) => {
          const totalPages = Math.ceil(total / PER_PAGE);
          if (state.currentPage >= totalPages && totalPages > 0) {
            return selectPage(state, totalPages - 1);
          } else {
            return assign({}, state, {
              tokens: items.map(token => ({
                id: token.sys.id,
                name: token.name
              })),
              loadingTokens: false,
              totalPages
            });
          }
        },
        [Failure]: () => assign(state, { loadingTokensError: true })
      })
  });

  function selectPage(state, page) {
    const request = tokenResourceManager.fetch({
      skip: page * PER_PAGE,
      limit: PER_PAGE
    });
    putRequest(request);
    return assign(state, {
      currentPage: page,
      loadingTokens: true
    });
  }

  const store = createStore(initialState, reduce);
  const actions = bindActions(store, {
    SelectPage,
    Revoke,
    OpenCreateDialog,
    Reload
  });

  actions.SelectPage(0);

  $scope.component = {
    store,
    render: (state, actions) => <PageComponent state={state} actions={actions} />,
    actions: {
      SelectPage,
      Revoke,
      OpenCreateDialog,
      Reload
    }
  };
  /* eslint-enable no-use-before-define */
}

function PageComponent({ state, actions }) {
  return (
    <div className={styles.page}>
      <OauthSection />
      <PATSection state={state} actions={actions} />
    </div>
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
          <div className="loading-box--stretched animate">
            <div className="loading-box__spinner" />
            <div className="loading-box__message">Loading</div>
          </div>
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
