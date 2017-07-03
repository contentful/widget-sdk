import { h } from 'utils/hyperscript';
import { byName } from 'Styles/Colors';

const padding = '20px';

export default function () {
  return h('.nav-sidepanel-container.app-top-bar--right-separator', {
    style: {
      height: '100%',
      textAlign: 'left'
    },
    ngClass: '{"modal-background": sidePanelIsShown, "is-visible": sidePanelIsShown}'
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
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        width: '350px',
        height: '100%',
        background: byName.elementLightest
      },
      ngClass: '{"nav-sidepanel--slide-in": sidePanelIsShown, "nav-sidepanel--slide-out": !sidePanelIsShown}'
    }, [
      h('.nav-sidepanel__header', {
        style: {
          display: 'flex',
          flexGrow: 1,
          maxHeight: '63px',
          background: byName.elementLight,
          borderBottom: `1px solid ${byName.elementDark}`,
          padding: `15px ${padding}`,
          cursor: 'pointer'
        },
        ngClick: 'toggleOrgsDropdown()'
      }, [
        h('p.nav-sidepanel__org-img', {
          style: {
            padding: '8px',
            background: byName.elementDark,
            color: byName.textDark,
            fontWeight: 'bold',
            fontSize: '0.9em',
            borderRadius: '2px',
            marginBottom: 0,
            marginRight: '10px'
          }
        }, ['{{twoLetterOrgName}}']),
        h('.nav-sidepanel__org-selector', {
          style: {
            flexGrow: 2
          }
        }, [
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column'
            }
          }, [
            h('p', {
              style: {
                fontWeight: 'bold',
                marginBottom: 0
              }
            }, ['Organization']),
            h('p', {
              style: {
                marginBottom: 0
              }
            }, ['{{currOrg.name}}'])
          ])
        ]),
        h('span', {
          style: {
            alignSelf: 'center',
            border: `4px solid ${byName.textDark}`,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent'
          }
        }),
        h('div.nav-sidepanel__org-list-container', {
          style: {
            background: 'white',
            flexDirection: 'column',
            position: 'absolute',
            top: '61px',
            width: '90%',
            left: '18px',
            boxShadow: `0px 1px 3px 1px ${byName.elementMid}`,
            display: 'flex'
          },
          ngShow: 'orgDropdownIsShown'
        }, [
          h('p', {
            style: {
              fontWeight: 'bold',
              marginBottom: 0,
              padding,
              paddingBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.9em'
            }
          }, ['Organizations']),
          h('.nav-sidepanel__org-list', {
            style: {
              maxHeight: '150px',
              overflow: 'hidden',
              overflowY: 'auto'
            }
          }, [
            h('p', {
              ngRepeat: 'org in orgs track by org.sys.id',
              ngIf: 'orgs.length',
              ngStyle: `{"background": currOrg && currOrg.sys.id === org.sys.id ? "${byName.elementLight}": ""}`,
              ngClick: 'setAndGotoOrg(org)',
              style: {
                cursor: 'pointer',
                padding: `10px ${padding}`,
                margin: 0
              }
            }, ['{{org.name}}'])
          ]),
          h('a.text-link', {
            style: {
              padding: `10px ${padding} ${padding}`,
              display: 'block'
            },
            ngClick: 'createNewOrg()'
          }, ['+ Create organization'])
        ])
      ]),
      h('.nav-sidepanel__spaces-container', [
        h('.nav-sidepanel__spaces-header', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            padding,
            paddingBottom: 0
          }
        }, [
          h('p', {
            style: {
              fontWeight: 'bold'
            }
          }, ['Spaces']),
          h('a.text-link', {
            ngIf: 'canCreateSpaceInCurrOrg',
            ngClick: 'showCreateSpaceModal(currOrg.sys.id)'
          }, [
            h('span', ['+ Add space'])
          ])
        ]),
        h('.nav-sidepanel__space-list', {
          style: {
            maxHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            overflowY: 'auto'
          }
        }, [
          h('p', {
            ngRepeat: 'space in spacesByOrg[currOrg.sys.id] track by space.data.sys.id',
            ngIf: 'spacesByOrg[currOrg.sys.id].length',
            ngStyle: `{"background": currSpace && currSpace.sys.id === space.data.sys.id ? "${byName.elementLight}": ""}`,
            ngClick: 'setAndGotoSpace(space.data)',
            style: {
              cursor: 'pointer',
              padding: `10px ${padding}`,
              margin: 0
            }
          }, ['{{space.data.name}}']),
          h('p', {
            ngIf: '!spacesByOrg[currOrg.sys.id].length',
            style: {
              padding,
              paddingTop: 0,
              margin: 0
            }
          }, ['no spaces found'])
        ])
      ]),
      h('.nav-sidepanel__org-actions', {
        style: {
          flexGrow: 1,
          padding,
          paddingTop: '10px'
        }
      }, [
        h('div', {
          style: {
            marginBottom: padding,
            borderBottom: `1px solid ${byName.elementDark}`
          }
        }, []),
        h('a.text-link', {
          ngIf: 'canGotoOrgSettings',
          ngClick: 'gotoOrgSettings()'
        }, ['Organization settings'])
      ]),
      h('.nav-sidepanel__close-btn', {
        style: {
          position: 'absolute',
          left: '375px',
          top: '20px',
          fontSize: '1.7em',
          color: 'white',
          cursor: 'pointer'
        },
        ngClick: 'toggleSidePanel()'
      }, [
        h('cf-icon', {
          name: 'close',
          scale: '0.8'
        })
      ])
    ])
  ]);
}
