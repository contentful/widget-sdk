import { h } from 'utils/hyperscript';

export default function () {
  return h('.nav-sidepanel-container.app-top-bar--right-separator', {
    style: {
      height: '100%'
    }
  }, [
    h('div', {
      ngClick: 'toggleSidePanel()',
      style: {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 15px'
      }
    }, [
      h('.app-top-bar__logo-element', {
        cfCustomLogo: 'cf-custom-logo'
      })
    ]),
    h('.nav-sidepanel', {
      style: {
        position: 'absolute',
        top: 0,
        left: '200px',
        zIndex: 999,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        width: '350px',
        height: '100%'
      },
      ngStyle: '{display: sidePanelIsShown ? "block" : "none"}'
    }, [
      h('.nav-sidepanel__header', {
        style: {
          flexGrow: 1,
          maxHeight: '80px'
        }
      }, [
        h('.nav-sidepanel__org-img', ['ORG']),
        h('.nav-sidepanel__org-selector', [
          h('select', {
            ngOptions: 'org.sys.id as org.name for org in orgs',
            ngModel: 'selectedOrgId',
            ngChange: 'selectOrgById(selectedOrgId)'
          }),
          h('a', {
            cfSref: '{path:[\'account\', \'organizations\', \'new\']}'
          }, ['Create org'])
        ])
      ]),
      h('.nav-sidepanel__spaces', {
        style: {
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          overflowY: 'auto'
        }
      }, [
        h('.nav-sidepanel__space-list', [
          h('.nav-sidepanel__something', [
            h('a', {
              ngIf: 'canCreateSpaceInCurrOrg',
              ngClick: 'showCreateSpaceModal(currOrg.sys.id)'
            }, ['Create space']),
            h('p', {
              ngRepeat: 'space in spacesByOrg[currOrg.sys.id] track by space.data.sys.id',
              ngIf: 'spacesByOrg[currOrg.sys.id].length',
              ngStyle: '{"text-decoration": currSpace && currSpace.sys.id === space.data.sys.id ? "underline": "none"}',
              ngClick: 'setAndGotoSpace(space.data)',
              style: {
                cursor: 'pointer'
              }
            }, ['{{space.data.name}}'])
          ]),
          h('p', {
            ngIf: '!spacesByOrg[currOrg.sys.id].length'
          }, ['no spaces found'])
        ])
      ]),
      h('.nav-sidepanel__org-actions', {
        style: {
          flexGrow: 1
        }
      }, [
        h('a', {
          ngIf: 'canGotoOrgSettings',
          cfSref: 'organizationRef'
        }, ['Goto org settings'])
      ])
    ])
  ]);
}
