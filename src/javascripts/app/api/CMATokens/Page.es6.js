import {create as createPaginator} from 'Paginator';
import * as Command from 'command';
import * as K from 'utils/kefir';
import {truncate} from 'stringUtils';

import {h, text} from 'utils/hyperscript';
import {container, vspace} from 'ui/Layout';
import {docsLink, linkOpen, p} from 'ui/Content';
import * as Table from 'ui/Content/Table';
import * as Workbench from '../Workbench';

import * as Config from 'Config';
import {createSlot} from 'utils/Concurrent';
import * as ResourceManager from './Resource';
import openCreateDialog from './CreateDialog';
import Notification from 'notification';
import {track} from 'analytics/Analytics';


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

  const putRequest = createSlot((result) => {
    if (result.type === 'success') {
      const {total, items} = result.value;
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
    } else {
      $scope.loadingTokensError = true;
    }
  });

  // Open the dialog to create a token. Reload afterwards
  $scope.openCreateDialog = () => {
    openCreateDialog(tokenResourceManager)
    .then(() => reloadBus.emit());
  };

  K.onValueScope($scope, reloadPage$, fetch);
  K.onValueScope($scope, userPage$, fetch);

  // Fetch the given page of cma tokens and put it into the renderer.
  function fetch (page) {
    $scope.loadingTokens = true;
    const request = tokenResourceManager.fetch({
      skip: page * PER_PAGE,
      limit: PER_PAGE
    });
    putRequest(request);
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


export function template () {
  return Workbench.withSidebar(
    container({
      padding: '2em 3em'
    }, [
      main()
    ]),
    sidebar()
  );
}


function main () {
  return [
    h('h1.section-title', ['OAuth tokens']),
    p([
      'OAuth tokens are issued by ', linkOpen(['OAuth applications'], '/account/profile/developers/applications'),
      ` and represent the user who granted access through this
      application. These tokens have the same rights as the owner of
      the account. You can `,
      docsLink('learn more about OAuth appliactions in our documentation', 'createOAuthApp'),
      '.'
    ]),
    vspace(7),
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
          ngClick: 'openCreateDialog()'
        }, ['Generate personal token'])
      ])
    ]),
    vspace(5),
    tokenList()
  ].join('');
}


/**
 * Template for the token table and the pagination
 *
 * Also includes the error note box when fetching the tokens failed and
 * the loader.
 */
function tokenList () {
  return h('div', [
    h('div', {
      ngIf: 'loadingTokensError'
    }, [h('.note-box--warning', [
      `The list of tokens failed to load, try refreshing the page. If
      the problem persists `, linkOpen(['contact support'], Config.supportUrl)
    ])]),
    h('div', {
      ngIf: '!loadingTokensError',
      dataTestId: 'pat.list'
    }, [
      container({
        position: 'relative',
        minHeight: '6em'
      }, [
        h('.loading-box--stretched.animate', {
          ngIf: 'loadingTokens'
        }, [
          h('.loading-box__spinner'),
          h('.loading-box__message', ['Loading'])
        ]),
        h('div', {
          ngIf: 'tokens.length'
        }, [
          tokenTable()
        ])
      ]),
      vspace(5),
      h('cf-search-results-paginator', {paginator: 'paginator', pages: 3})
    ])
  ]);
}

function tokenTable () {
  return Table.table(
    Table.head([
      [['Name'], {}],
      [[''], {}]
    ]),
    Table.body({
      ngRepeat: 'token in tokens track by token.id',
      dataTestId: 'pat.tokenRow.{{token.id}}'
    }, [
      [['{{token.name}}'], {
        style: {
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }
      }],
      [[revokeButton()], {
        style: {
          width: '7em',
          textAlign: 'right'
        }
      }]
    ])
  );
}

function revokeButton () {
  return h('div', {
    style: { textAlign: 'right' }
  }, [
    h('button.text-link--destructive', {
      cfContextMenuTrigger: '',
      dataTestId: 'pat.revoke.{{token.id}}.request'
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
        dataTestId: 'pat.revoke.{{token.id}}.confirm',
        uiCommand: 'token.revokeCommand'
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
  ].join('');
}
