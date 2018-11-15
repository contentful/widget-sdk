import React from 'react';
import PropTypes from 'prop-types';
import { assign } from 'lodash';
import { byName as Colors } from 'Styles/Colors.es6';
import { createSlot, Success, Failure } from 'utils/Concurrent.es6';
import { truncate } from 'utils/StringUtils.es6';
import { makeCtor, match } from 'utils/TaggedValues.es6';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@contentful/ui-component-library';
import { h } from 'ui/Framework';
import { createStore, bindActions, makeReducer } from 'ui/Framework/Store.es6';
import escape from 'utils/escape.es6';
import { container, vspace } from 'ui/Layout.es6';
import { DocsLink, LinkOpen } from 'ui/Content.es6';

import * as Config from 'Config.es6';
import * as ResourceManager from './Resource.es6';
import openCreateDialog from './CreateDialog.es6';
import Notification from 'notification';
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
      openCreateDialog(tokenResourceManager, actions.Reload);
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
              totalPages: totalPages
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
    render,
    actions: {
      SelectPage,
      Revoke,
      OpenCreateDialog,
      Reload
    }
  };
  /* eslint-enable no-use-before-define */
}

function render(state, actions) {
  return container(
    {
      padding: '2em 3em'
    },
    [oauthSection(), vspace(7), patSection(state, actions)]
  );
}

function patSection(state, actions) {
  return h('div', [
    h('h1.section-title', ['Personal Access Tokens']),
    container(
      {
        display: 'flex'
      },
      [
        <p
          key="pat-section-explanation"
          style={{
            lineHeight: '1.5',
            color: Colors.textMid
          }}>
          As an alternative to OAuth applications, you can also leverage Personal Access Tokens to
          use the Content Management API. These tokens are always bound to your individual account,
          with the same permissions you have on all of your spaces and organizations.
        </p>,
        container(
          {
            marginLeft: '1em',
            flex: '0 0 auto'
          },
          [
            h(
              'button.btn-action',
              {
                dataTestId: 'pat.create.open',
                onClick: actions.OpenCreateDialog
              },
              ['Generate personal token']
            )
          ]
        )
      ]
    ),
    vspace(5),
    tokenList(state, actions)
  ]);
}

function oauthSection() {
  return h('div', [
    h('h1.section-title', ['OAuth tokens']),
    h('p', [
      'OAuth tokens are issued by OAuth applications',
      ` and represent the user who granted access through this
      application. These tokens have the same rights as the owner of
      the account. You can `,
      <DocsLink
        key="create-oauth-link"
        text="learn more about OAuth applications in our documentation"
        target="createOAuthApp"
      />,
      '.'
    ])
  ]);
}

/**
 * Template for the token table and the pagination
 *
 * Also includes the error note box when fetching the tokens failed and
 * the loader.
 */
function tokenList(
  { loadingTokens, loadingTokensError, tokens, currentPage, totalPages },
  { Revoke, SelectPage }
) {
  return loadingTokensError
    ? h('.note-box--warning', [
        `The list of tokens failed to load, try refreshing the page. If
      the problem persists `,
        <LinkOpen key="contact-support-link" url={Config.supportUrl}>
          contact support
        </LinkOpen>
      ])
    : h(
        'div',
        {
          dataTestId: 'pat.list'
        },
        [
          container(
            {
              position: 'relative',
              minHeight: '6em'
            },
            [
              loadingTokens &&
                h('.loading-box--stretched.animate', [
                  h('.loading-box__spinner'),
                  h('.loading-box__message', ['Loading'])
                ]),
              h(TokenTable, { tokens, revoke: Revoke })
            ]
          ),
          vspace(5),
          h(Paginator, {
            select: SelectPage,
            page: currentPage,
            pageCount: totalPages
          })
        ]
      );
}

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
          <TableRow key={token.id} data-test-id={`pat.tokenRow.${token.id}`}>
            <TableCell
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}>
              {token.name}
            </TableCell>
            <TableCell
              style={{
                width: '7em',
                textAlign: 'right'
              }}>
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
  return (
    <div style={{ textAlign: 'right' }}>
      <button
        className="text-link--destructive"
        cf-context-menu-trigger="true"
        data-test-id={`pat.revoke.${token.id}.request`}>
        Revoke
      </button>
      <div
        className="delete-confirm context-menu x--arrow-right"
        style={{ display: 'none' }}
        cf-context-menu="bottom-right">
        <p>
          This token won’t be available anymore, any application using it might break. Do you
          confirm?
        </p>
        <button
          data-test-id={`pat.revoke.${token.id}.confirm`}
          onClick={() => revoke(token)}
          className="btn-caution">
          Revoke
        </button>
        <button className="btn-secondary-action">Cancel</button>
      </div>
    </div>
  );
}

RevokeButton.propTypes = {
  revoke: PropTypes.func.isRequired,
  token: PropTypes.object.isRequired
};
