import { assign } from 'lodash';
import { createSlot, Success, Failure } from 'utils/Concurrent';
import { truncate } from 'stringUtils';
import { makeCtor, match } from 'utils/TaggedValues';

import {h} from 'ui/Framework';
import {createStore, bindActions, makeReducer} from 'ui/Framework/Store';
import {text} from 'utils/hyperscript';
import {container, vspace} from 'ui/Layout';
import {docsLink, linkOpen, p} from 'ui/Content';
import {table, tr, td, th} from 'ui/Content/Table';
import * as Workbench from '../Workbench';

import * as Config from 'Config';
import * as ResourceManager from './Resource';
import openCreateDialog from './CreateDialog';
import Notification from 'notification';
import {track} from 'analytics/Analytics';

import renderPaginator from 'ui/Components/Paginator';

// Number of tokens to fetch and show per page
const PER_PAGE = 10;

// Actions
const SelectPage = makeCtor('SelectPage');
const Revoke = makeCtor('Revoke');
const Reload = makeCtor('Reload');
const OpenCreateDialog = makeCtor('OpenCreateDialog');
const ReceiveResponse = makeCtor('ReceiveResponse');

export function initController ($scope, auth) {
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
  const putRequest = createSlot((result) => {
    store.dispatch(ReceiveResponse, result);
  });

  const reduce = makeReducer({
    [SelectPage]: selectPage,
    [Reload]: (state) => {
      return selectPage(state, state.currentPage);
    },
    [Revoke]: (state, token) => {
      const id = token.id;
      tokenResourceManager.revoke(id).then(
        () => {
          track('personal_access_token:action', {action: 'revoke', patId: id});
          Notification.info(`The token “${text(truncate(token.name, 30))}” has been successfully revoked.`);
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
    [OpenCreateDialog]: (state) => {
      openCreateDialog(tokenResourceManager)
        .then(() => actions.Reload());
      return state;
    },
    [ReceiveResponse]: (state, result) => match(result, {
      [Success]: ({total, items}) => {
        const totalPages = Math.ceil(total / PER_PAGE);
        if (state.currentPage >= totalPages && totalPages > 0) {
          return selectPage(state, totalPages - 1);
        } else {
          return assign({}, state, {
            tokens: items.map((token) => ({
              id: token.sys.id,
              name: token.name
            })),
            loadingTokens: false,
            totalPages: totalPages
          });
        }
      },
      [Failure]: () => assign(state, {loadingTokensError: true})
    })
  });

  function selectPage (state, page) {
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
    SelectPage, Revoke, OpenCreateDialog, Reload
  });

  actions.SelectPage(0);

  $scope.component = {
    store,
    render,
    actions: {
      SelectPage, Revoke, OpenCreateDialog, Reload
    }
  };
  /* eslint-enable no-use-before-define */
}


function render (state, actions) {
  return container({
    padding: '2em 3em'
  }, [
    oauthSection(),
    vspace(7),
    patSection(state, actions)
  ]);
}


export function template () {
  return Workbench.withSidebar(
    h('cf-component-store-bridge', {component: 'component'}),
    sidebar()
  );
}

function patSection (state, actions) {
  return h('div', [
    h('h1.section-title', ['Personal Access Tokens']),
    container({
      display: 'flex'
    }, [
      p([
        `As an alternative to OAuth applications, you can also leverage
        Personal Access Tokens to use the Content Management API. These
        tokens are always bound to your individual account, with the
        same permissions you have on all of your spaces and
        organizations.`
      ]),
      container({
        marginLeft: '1em',
        flex: '0 0 auto'
      }, [
        h('button.btn-action', {
          dataTestId: 'pat.create.open',
          onClick: actions.OpenCreateDialog
        }, ['Generate personal token'])
      ])
    ]),
    vspace(5),
    tokenList(state, actions)
  ]);
}


function oauthSection () {
  return h('div', [
    h('h1.section-title', ['OAuth tokens']),
    h('p', [
      'OAuth tokens are issued by OAuth applications',
      ` and represent the user who granted access through this
      application. These tokens have the same rights as the owner of
      the account. You can `,
      docsLink('learn more about OAuth appliactions in our documentation', 'createOAuthApp'),
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
function tokenList ({
  loadingTokens,
  loadingTokensError,
  tokens,
  currentPage,
  totalPages
}, {
  Revoke,
  SelectPage
}) {
  return loadingTokensError
    ? h('.note-box--warning', [
      `The list of tokens failed to load, try refreshing the page. If
      the problem persists `, linkOpen(['contact support'], Config.supportUrl)
    ])
    : h('div', {
      dataTestId: 'pat.list'
    }, [
      container({
        position: 'relative',
        minHeight: '6em'
      }, [
        loadingTokens &&
          h('.loading-box--stretched.animate', [
            h('.loading-box__spinner'),
            h('.loading-box__message', ['Loading'])
          ]),
        tokenTable(tokens, Revoke)
      ]),
      vspace(5),
      renderPaginator(SelectPage, currentPage, totalPages)
    ]);
}

function tokenTable (tokens, revoke) {
  if (tokens.length === 0) {
    return h('div');
  }

  return table(
    [
      th(['Name']),
      th(['']) // Revoke action
    ], tokens.map((token) => {
      return tr({
        dataTestId: `pat.tokenRow.${token.id}`
      }, [
        td({
          style: {
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }
        }, [token.name]),
        td({
          style: {
            width: '7em',
            textAlign: 'right'
          }
        }, [revokeButton(revoke, token)])
      ]);
    })
  );
}


function revokeButton (revoke, token) {
  return h('div', {
    style: { textAlign: 'right' }
  }, [
    h('button.text-link--destructive', {
      cfContextMenuTrigger: '',
      dataTestId: `pat.revoke.${token.id}.request`
    }, [ 'Revoke' ]),
    h('.delete-confirm.context-menu.x--arrow-right', {
      style: {display: 'none'},
      cfContextMenu: 'bottom-right'
    }, [
      h('p', [
        `This token won’t be available anymore, any application using
        it might break. Do you confirm?`
      ]),
      h('button.btn-caution', {
        dataTestId: `pat.revoke.${token.id}.confirm`,
        onClick: () => revoke(token)
      }, ['Revoke']),
      h('button.btn-secondary-action', ['Cancel'])
    ])
  ]);
}


function sidebar () {
  return [
    h('h2.entity-sidebar__heading', ['Documentation']),
    h('.entity-sidebar__text-profile', [
      p([
        `The Content Management API, unlike the Content Delivery API,
        provides read and write access to your Contentful spaces. This
        enables integrating content management to your development
        workflow, perform automation operations…`
      ]),
      h('ul', [
        h('li', [
          docsLink('Content Management API reference', 'management_api')
        ]),
        h('li', [
          docsLink('Other Contentful APIs', 'content_apis')
        ])
      ])
    ])
  ];
}
