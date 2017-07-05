import { h } from 'utils/hyperscript';
import { byName, genBoxShadow } from 'Styles/Colors';

const padding = '20px';

export default function () {
  return h('.nav-sidepanel-container.app-top-bar--right-separator', {
    style: {
      height: '100%',
      zIndex: 1000
    }
  }, [
    h('div.nav-sidepanel__bg', {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'rgba(12, 20, 28, 0.75)',
        height: '100%',
        width: '100%',
        zIndex: 0,
        transition: 'opacity 0.2s ease-in-out'
      },
      ngClass: 'sidePanelIsShown ? "nav-sidepanel__bg--is-visible" : "nav-sidepanel__bg--is-not-visible"',
      ngClick: 'toggleSidePanel()'
    }),
    h('div.nav-sidepanel__logo-container', {
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
        display: 'flex',
        flexDirection: 'column',
        width: '350px',
        height: '100%',
        background: byName.elementLightest,
        zIndex: 1
      },
      ngClass: '{"nav-sidepanel--slide-in": sidePanelIsShown, "nav-sidepanel--slide-out": !sidePanelIsShown}'
    }, [
      h('.nav-sidepanel__header', {
        style: {
          display: 'flex',
          flexGrow: 1,
          maxHeight: '63px',
          minHeight: '63px',
          background: byName.elementLight,
          borderBottom: `1px solid ${byName.elementMid}`,
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
            width: '90%',
            left: '18px',
            boxShadow: genBoxShadow(),
            border: `1px solid ${byName.elementMid}`,
            display: 'flex',
            transition: 'all 0.2s ease-in-out'
          },
          ngClass: 'orgDropdownIsShown ? "nav-sidepanel__org-list-container--is-visible" : "nav-sidepanel__org-list-container--is-not-visible"'
        }, [
          h('.nav-sidepanel__org-list', {
            style: {
              maxHeight: '184px',
              overflow: 'hidden',
              overflowY: 'auto',
              paddingBottom: '8px',
              lineHeight: 1.5
            }
          }, [
            h('p', {
              style: {
                fontWeight: 600,
                marginBottom: 0,
                padding,
                paddingBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontSize: '0.9em'
              }
            }, ['Organizations']),
            h('p.nav-sidepanel__org-name', {
              ngRepeat: 'org in orgs track by org.sys.id',
              ngIf: 'orgs.length',
              ngStyle: `{"background": currOrg && currOrg.sys.id === org.sys.id ? "${byName.elementLight}": ""}`,
              ngClick: 'setCurrOrg(org)',
              style: {
                cursor: 'pointer',
                padding: `8px ${padding} 8px`,
                margin: 0,
                transition: 'background-color 0.1s ease-in-out'
              }
            }, ['{{org.name}}'])
          ]),
          h('a.text-link', {
            style: {
              padding: `${padding} ${padding} ${padding}`,
              display: 'block',
              borderTop: `1px solid ${byName.elementMid}`
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
            ngIf: 'spacesByOrg[currOrg.sys.id].length',
            style: {
              fontWeight: 'bold'
            }
          }, ['Spaces']),
          h('a.text-link', {
            ngIf: 'canCreateSpaceInCurrOrg && spacesByOrg[currOrg.sys.id].length',
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
          h('.nav-sidepanel__no-spaces', {
            ngIf: '!spacesByOrg[currOrg.sys.id].length',
            style: {
              padding,
              paddingBottom: '40px',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center'
            }
          }, [
            h('cf-icon', {
              name: 'sidepanel-spaces-advice',
              scale: '1.2',
              style: {
                marginBottom: '20px'
              }
            }),
            h('p', {
              style: {
                fontWeight: 'bold'
              }
            }, ['{{canCreateSpaceInCurrOrg ? "Let’s go - create your first space!" : "Uh oh! Nothing to see here"}}']),
            h('p', ['{{canCreateSpaceInCurrOrg ? "A space is a place where you keep all the content related to a single project." : "Seems like you don’t have access to any of your organization’s spaces. Contact your organization admin to add you to spaces."}}']),
            h('button.btn-action', {
              style: {
                width: '44%',
                marginTop: '10px'
              },
              ngIf: 'canCreateSpaceInCurrOrg',
              ngClick: 'showCreateSpaceModal(currOrg.sys.id)'
            }, ['Create Space'])
          ])
        ])
      ]),
      h('.nav-sidepanel__org-actions', {
        ngIf: 'canGotoOrgSettings',
        style: {
          flexGrow: 1,
          padding,
          paddingTop: '10px'
        }
      }, [
        h('div', {
          style: {
            marginBottom: padding,
            borderBottom: `1px solid ${byName.elementMid}`
          }
        }, []),
        h('a.text-link', {
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
