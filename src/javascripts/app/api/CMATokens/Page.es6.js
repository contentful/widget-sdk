import {create as createPaginator} from 'Paginator';
import * as Command from 'command';
import * as K from 'utils/kefir';
import {makeMatcher} from 'utils/TaggedValues';
import {truncate} from 'stringUtils';

import {h} from 'ui/Framework';
import {text} from 'utils/hyperscript';
import {container, vspace} from 'ui/Layout';
import {docsLink, linkOpen, p} from 'ui/Content';
import {table, tr, td, th} from 'ui/Content/Table';
import * as Workbench from '../Workbench';

import * as Config from 'Config';
import {createSlot, Success, Failure} from 'utils/Concurrent';
import * as ResourceManager from './Resource';
import openCreateDialog from './CreateDialog';
import Notification from 'notification';
import {track} from 'analytics/Analytics';

import renderPaginator from 'ui/Components/Paginator';

// Number of tokens to fetch and show per page
const PER_PAGE = 10;

export function initController ($scope, auth) {
  const tokenResourceManager = ResourceManager.create(auth);

  const paginator = createPaginator(PER_PAGE);
  $scope.paginator = paginator;

  // Property that holds the page number currently selected by the
  // user.
  const userPage$ =
    K.fromScopeValue($scope, (scope) => scope.paginator.getPage())
    .skipDuplicates();


  // Emits an event if we want to reload the current token page
  const reloadBus = K.createStreamBus($scope);
  const reloadPage$ = userPage$.sampledBy(reloadBus.stream);

  const putRequest = createSlot(makeMatcher({
    [Success]: ({total, items}) => {
      $scope.tokens = items.map(makeViewToken);
      paginator.setTotal(total);
      if (paginator.isBeyondLast()) {
        // This triggers 'fetch' again through a change in the
        // userPage$ property. This is an akward solution. We should
        // improve on it with a better paginator
        paginator.setPage(paginator.getPageCount() - 1);
      } else {
        $scope.loadingTokens = false;
      }
      renderWithScope();
    },
    [Failure]: () => {
      $scope.loadingTokensError = true;
      renderWithScope();
    }
  }));


  // Open the dialog to create a token. Reload afterwards
  $scope.openCreateDialog = () => {
    openCreateDialog(tokenResourceManager)
    .then(() => reloadBus.emit());
  };

  $scope.selectPage = function (page) {
    paginator.setPage(page);
    fetch(page);
  };

  K.onValueScope($scope, reloadPage$, fetch);
  K.onValueScope($scope, userPage$, fetch);

  renderWithScope();

  // Fetch the given page of cma tokens and put it into the renderer.
  function fetch (page) {
    $scope.loadingTokens = true;
    const request = tokenResourceManager.fetch({
      skip: page * PER_PAGE,
      limit: PER_PAGE
    });
    putRequest(request);
    renderWithScope();
  }

  function renderWithScope () {
    $scope.component = render($scope);
  }

  // Turn a token resource into an object consumed by the view.
  function makeViewToken (token) {
    const id = token.sys.id;
    return {
      id: id,
      name: token.name,
      revokeCommand: Command.create(() => {
        return tokenResourceManager.revoke(id)
          .then(() => {
            reloadBus.emit();
            track('personal_access_token:action', {action: 'revoke', patId: id});
            Notification.info(`The token “${text(truncate(token.name, 30))}” has been successfully revoked.`);
          }, () => {
            Notification.error(
              'Revoking failed, please try again. If the problem persists, contact support.'
            );
          });
      })
    };
  }
}

function render (state) {
  return container({
    padding: '2em 3em'
  }, [
    oauthSection(),
    vspace(7),
    patSection(state)
  ]);
}


export function template () {
  return Workbench.withSidebar(
    h('cf-component-bridge', {component: 'component'}),
    sidebar()
  );
}

function patSection (state) {
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
          onClick: state.openCreateDialog
        }, ['Generate personal token'])
      ])
    ]),
    vspace(5),
    tokenList(state)
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
  paginator, selectPage
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
        tokenTable(tokens)
      ]),
      vspace(5),
      renderPaginator(selectPage, paginator.getPage(), paginator.getPageCount())
    ]);
}

function tokenTable (tokens = []) {
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
        }, [revokeButton(token)])
      ]);
    })
  );
}


function revokeButton (token) {
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
        onClick: () => token.revokeCommand.execute()
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
