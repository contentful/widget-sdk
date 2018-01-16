import { h } from 'utils/hyperscript';
import { genBoxShadow, triangleDown } from 'Styles';
import { byName as colors } from 'Styles/Colors';
import { extend } from 'lodash';

const padding = '20px';

export default function () {
  return h('.nav-sidepanel-container', {
    style: {
      zIndex: 1000,
      position: 'absolute'
    }
  }, [
    sidepanelBackground(),
    sidepanel()
  ]);
}

function sidepanelBackground () {
  return h('div.nav-sidepanel__bg', {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      backgroundColor: 'rgba(12, 20, 28, 0.75)',
      height: '100vh',
      width: '100vw',
      zIndex: 0,
      transition: 'all 0.2s ease-in-out'
    },
    ngClass: 'sidePanelIsShown ? "nav-sidepanel__bg--is-visible" : "nav-sidepanel__bg--is-not-visible"',
    ngClick: 'orgDropdownIsShown ? closeOrgsDropdown() : closeSidePanel()'
  });
}

function sidepanel () {
  return h('.nav-sidepanel', {
    style: {
      position: 'absolute',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      width: '350px',
      height: '100vh',
      background: colors.elementLightest,
      zIndex: 1,
      lineHeight: 1.5
    },
    ngClass: '{"nav-sidepanel--slide-in": sidePanelIsShown, "nav-sidepanel--slide-out": !sidePanelIsShown}',
    ngClick: 'closeOrgsDropdown()',
    dataTestId: 'sidepanel'
  }, [
    organizationSelector(),
    orgSpaces(),
    orgActions(),
    closeBtn()
  ]);
}

function organizationSelector () {
  const currOrgIcon = h('p.nav-sidepanel__org-img', {
    style: {
      flex: '0 0 35px',
      height: '35px',
      background: colors.elementDarkest,
      color: colors.textDark,
      fontWeight: 'bold',
      fontSize: '0.9em',
      textAlign: 'center',
      lineHeight: '35px',
      borderRadius: '2px',
      marginBottom: 0,
      marginRight: '15px'
    }
  }, ['{{twoLetterOrgName}}']);

  const currOrgText = h('.nav-sidepanel__org-selector', {
    style: {
      flexGrow: 2,
      minWidth: 0,
      overflow: 'hidden'
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
          color: colors.textMid,
          marginBottom: 0,
          paddingRight: '10px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        },
        title: '{{currOrg.name}}'
      }, ['{{currOrg.name}}'])
    ])
  ]);

  return [h('.nav-sidepanel__header', {
    style: {
      display: 'flex',
      alignItems: 'center',
      height: '70px',
      flexShrink: 0,
      borderBottom: `1px solid ${colors.elementDark}`,
      padding: `0 ${padding}`,
      cursor: 'pointer',
      transition: 'background-color 0.1s ease-in-out'
    },
    ngClass: 'orgDropdownIsShown ? "nav-sidepanel__header--is-active": ""',
    ngClick: 'openOrgsDropdown($event);'
  }, [
    currOrgIcon,
    currOrgText,
    h('span', { style: extend(triangleDown()) })
  ]), orgListDropdown()].join('');
}

function orgListDropdown () {
  return h('div.nav-sidepanel__org-list-container', {
    style: {
      background: 'white',
      flexDirection: 'column',
      position: 'absolute',
      width: '90%',
      left: '18px',
      boxShadow: genBoxShadow(),
      border: `1px solid ${colors.elementMid}`,
      display: 'flex',
      transition: 'all 0.2s ease-in-out',
      cursor: 'auto'
    },
    ngClass: 'orgDropdownIsShown ? "nav-sidepanel__org-list-container--is-visible" : "nav-sidepanel__org-list-container--is-not-visible"',
    dataTestId: 'sidepanel-org-list'
  }, [
    h('.nav-sidepanel__org-list', {
      style: {
        maxHeight: '184px',
        width: '100%',
        overflow: 'hidden',
        overflowY: 'auto',
        paddingBottom: '6px',
        lineHeight: 1.5
      }
    }, [
      h('p', {
        style: {
          fontWeight: 600,
          marginBottom: 0,
          padding,
          paddingBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontSize: '0.9em',
          lineHeight: '1'
        }
      }, ['Organizations']),
      h('p.nav-sidepanel__org-name.u-truncate', {
        ngRepeat: 'org in orgs track by org.sys.id',
        ngClass: '{"nav-sidepanel__org-name--is-active": currOrg && currOrg.sys.id === org.sys.id}',
        ngClick: 'setCurrOrg(org)',
        dataTestId: 'sidepanel-org-link',
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
        padding: `14px ${padding} ${padding}`,
        display: 'block',
        borderTop: `1px solid ${colors.elementMid}`
      },
      ngClick: 'createNewOrg()',
      ngShow: 'canCreateOrg',
      dataTestId: 'sidepanel-create-org-link'
    }, ['+ Create organization'])
  ]);
}

function orgSpaces () {
  return h('.nav-sidepanel__spaces-container', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '100%',
      overflow: 'hidden'
    }
  }, [
    h('.nav-sidepanel__spaces-header', {
      ngIf: 'spacesByOrg[currOrg.sys.id].length',
      style: {
        display: 'flex',
        flexShrink: 0,
        justifyContent: 'space-between',
        padding,
        paddingBottom: 0
      }
    }, [
      h('p', { style: { fontWeight: 'bold' } }, ['Spaces']),
      h('a.text-link', {
        ngIf: 'canCreateSpaceInCurrOrg',
        ngClick: 'showCreateSpaceModal(currOrg.sys.id)',
        dataTestId: 'sidepanel-create-space-link'
      }, [
        h('span', ['+ Add space'])
      ])
    ]),
    h('.nav-sidepanel__space-list', {
      style: {
        overflowY: 'auto'
      }
    }, [
      h('p.nav-sidepanel__space-name.u-truncate', {
        ngRepeat: 'space in spacesByOrg[currOrg.sys.id] track by space.sys.id',
        ngClass: '{"nav-sidepanel__space-name--is-active": currSpace && currSpace.sys.id === space.sys.id}',
        ngClick: 'setAndGotoSpace(space)',
        dataTestId: 'sidepanel-space-link',
        style: {
          color: colors.textMid,
          cursor: 'pointer',
          padding: `8px ${padding}`,
          margin: 0,
          transition: 'background-color 0.1s ease-in-out'
        }
      }, ['{{space.name}}']),
      noSpacesMsg()
    ])
  ]);
}

function noSpacesMsg () {
  const messages = {
    canCreateSpace: {
      title: 'Let’s go - create your first space!',
      text: 'A space is a place where you keep all the content related to a single project.'
    },
    canNotCreateSpace: {
      title: 'Uh oh! Nothing to see here',
      text: 'Seems like you don’t have access to any of your organization’s spaces. Contact your organization admin to add you to spaces.'
    }
  };

  return h('.nav-sidepanel__no-spaces', {
    ngIf: '!spacesByOrg[currOrg.sys.id].length',
    dataTestId: 'sidepanel-no-spaces',
    style: {
      padding,
      paddingBottom: '28px',
      margin: 0,
      textAlign: 'center'
    }
  }, [
    h('cf-icon', {
      name: 'space',
      style: {
        margin: '20px 0 14px',
        fill: colors.greenDark,
        display: 'inline-block'
      }
    }),
    h('p', { style: { fontWeight: 'bold' } }, [`{{canCreateSpaceInCurrOrg ? "${messages.canCreateSpace.title}" : "${messages.canNotCreateSpace.title}"}}`]),
    h('p', [`{{canCreateSpaceInCurrOrg ? "${messages.canCreateSpace.text}" : "${messages.canNotCreateSpace.text}"}}`]),
    h('button.btn-action', {
      style: {
        width: '44%',
        marginTop: '10px',
        whteSpace: 'nowrap'
      },
      ngIf: 'canCreateSpaceInCurrOrg',
      ngClick: 'showCreateSpaceModal()'
    }, ['Create Space'])
  ]);
}

function orgActions () {
  const separator = h('div', {
    style: {
      paddingLeft: `${padding}`,
      paddingRight: `${padding}`
    }
  }, [
    h('div', {
      style: {
        marginBottom: '12px',
        borderBottom: `1px solid ${colors.elementDark}`
      }
    })
  ]);

  return h('.nav-sidepanel__org-actions', {
    ngIf: 'canGotoOrgSettings',
    dataTestId: 'sidepanel-org-actions',
    style: {
      flexGrow: 1,
      padding: '12px 0'
    }
  }, [
    separator,
    h('p.nav-sidepanel__org-actions-goto-settings', {
      ngClick: 'gotoOrgSettings()',
      dataTestId: 'sidepanel-org-actions-settings',
      style: {
        color: colors.textMid,
        cursor: 'pointer',
        margin: 0,
        padding: `8px ${padding}`,
        transition: 'background-color 0.1s ease-in-out'
      },
      ngClass: '{"nav-sidepanel__org-actions-goto-settings--is-active": viewingOrgSettings }'
    }, ['Organization settings'])
  ]);
}

function closeBtn () {
  return h('.nav-sidepanel__close-btn', {
    style: {
      position: 'absolute',
      left: '375px',
      top: '27px',
      fontSize: '1.7em',
      color: 'white',
      cursor: 'pointer'
    },
    ngClick: 'closeSidePanel()',
    dataTestId: 'sidepanel-close-btn'
  }, [
    h('cf-icon', {
      name: 'close',
      scale: '0.8'
    })
  ]);
}
