import { h } from 'utils/hyperscript';
import { byName as colors, genBoxShadow } from 'Styles/Colors';

const padding = '20px';

export default function () {
  return h('.nav-sidepanel-container', {
    style: {
      zIndex: 1000
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
      height: '100%',
      width: '100%',
      zIndex: 0,
      transition: 'all 0.2s ease-in-out'
    },
    ngClass: 'sidePanelIsShown ? "nav-sidepanel__bg--is-visible" : "nav-sidepanel__bg--is-not-visible"',
    ngClick: 'closeSidePanel()'
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
      height: '100%',
      background: colors.elementLightest,
      zIndex: 1,
      lineHeight: 1.5
    },
    ngClass: '{"nav-sidepanel--slide-in": sidePanelIsShown, "nav-sidepanel--slide-out": !sidePanelIsShown}',
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
      padding: '10px',
      background: colors.elementDarkest,
      color: colors.textDark,
      fontWeight: 'bold',
      fontSize: '0.9em',
      borderRadius: '2px',
      marginBottom: 0,
      marginRight: '15px'
    }
  }, ['{{twoLetterOrgName}}']);

  const currOrgText = h('.nav-sidepanel__org-selector', {
    style: {
      flexGrow: 2,
      minWidth: 0
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
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        },
        title: '{{currOrg.name}}'
      }, ['{{currOrg.name}}'])
    ])
  ]);

  const triangleDown = h('span', {
    style: {
      alignSelf: 'center',
      border: `4px solid ${colors.textDark}`,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent'
    }
  });

  return h('.nav-sidepanel__header', {
    style: {
      display: 'flex',
      flexGrow: 1,
      maxHeight: '70px',
      minHeight: '70px',
      borderBottom: `1px solid ${colors.elementDark}`,
      padding: `15px ${padding}`,
      cursor: 'pointer',
      transition: 'background-color 0.1s ease-in-out'
    },
    ngClass: 'orgDropdownIsShown ? "nav-sidepanel__header--is-active": ""',
    ngClick: 'toggleOrgsDropdown()'
  }, [
    currOrgIcon,
    currOrgText,
    triangleDown,
    orgListDropdown()
  ]);
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
        overflow: 'hidden',
        overflowY: 'auto',
        paddingBottom: '12px',
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
        padding: `${padding} ${padding} ${padding}`,
        display: 'block',
        borderTop: `1px solid ${colors.elementMid}`
      },
      ngClick: 'createNewOrg()',
      dataTestId: 'sidepanel-create-org-link'
    }, ['+ Create organization'])
  ]);
}

function orgSpaces () {
  return h('.nav-sidepanel__spaces-container', [
    h('.nav-sidepanel__spaces-header', {
      ngIf: 'spacesByOrg[currOrg.sys.id].length',
      style: {
        display: 'flex',
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
        maxHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        overflowY: 'auto'
      }
    }, [
      h('p.nav-sidepanel__space-name', {
        ngRepeat: 'space in spacesByOrg[currOrg.sys.id] track by space.data.sys.id',
        ngClass: '{"nav-sidepanel__space-name--is-active": currSpace && currSpace.sys.id === space.data.sys.id}',
        ngClick: 'setAndGotoSpace(space.data)',
        dataTestId: 'sidepanel-space-link',
        style: {
          color: colors.textMid,
          cursor: 'pointer',
          padding: `8px ${padding}`,
          margin: 0,
          transition: 'background-color 0.1s ease-in-out'
        }
      }, ['{{space.data.name}}']),
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
    h('p', { style: { fontWeight: 'bold' } }, [`{{canCreateSpaceInCurrOrg ? "${messages.canCreateSpace.title}" : "${messages.canNotCreateSpace.title}"}}`]),
    h('p', [`{{canCreateSpaceInCurrOrg ? "${messages.canCreateSpace.text}" : "${messages.canNotCreateSpace.text}"}}`]),
    h('button.btn-action', {
      style: {
        width: '44%',
        marginTop: '10px'
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
      paddingTop: '10px'
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
