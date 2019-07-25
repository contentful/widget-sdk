import React from 'react';
import PropTypes from 'prop-types';
import { get as getAtPath } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import ViewFolder from './ViewFolder.es6';
import openInputDialog from 'app/InputDialog.es6';
import AddFolderIcon from 'svg/add-folder.es6';

const styles = {
  'view-menu-wrapper': css({
    height: '100%',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column'
  }),
  'view-menu': css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexGrow: 1,
    '.sortable-ghost': {
      backgroundColor: tokens.colorElementLightest,
      opacity: '0.6',
      filter: 'alpha(opacity=60)',
      border: '1px dashed #d3dce0'
    }
  }),
  'view-menu__folders': css({
    flex: '1 0 200px',
    overflowY: 'auto',
    paddingTop: '10px'
  }),
  'view-menu__actions': css({
    borderTop: '1px solid rgb(211, 220, 224)',
    flex: '0 1 75px',
    height: '75px',
    maxHeight: '75px',
    backgroundColor: tokens.colorElementLightest,
    paddingTop: tokens.spacingL,
    button: {
      marginLeft: '1.5em',
      marginBottom: '10px',
      i: {
        display: 'inline-block',
        marginRight: '5px'
      }
    }
  }),
  'view-menu__empty': css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }),
  'view-menu__empty-message': css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }),
  'view-menu__empty-cta': css({
    flex: '1',
    position: 'relative',
    button: {
      position: 'absolute',
      bottom: '5px',
      paddingLeft: '1.5rem'
    }
  })
};

const Folders = ({ state, actions }) => {
  return (
    <div ref={state.dnd.forFolders}>
      {state.folders.map(folder => {
        return <ViewFolder key={folder.id} folder={folder} state={state} actions={actions} />;
      })}
    </div>
  );
};
Folders.propTypes = {
  state: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};

const Empty = ({ state, actions }) => {
  const { canEdit } = state;

  return (
    <div className={styles['view-menu__empty']}>
      <div className={styles['view-menu__empty-description']}>
        <div className={styles['view-folder__empty']}>
          <strong>There are no views yet</strong>
          {state.canEdit && (
            <p>
              A view displays a list of entries you searched for. By saving the a view to this list,
              you will be able to re-use it later.
            </p>
          )}
          {!state.canEdit && (
            <p>
              A view displays a list of entries you searched for. Your administrator has not set up
              any views yet.
            </p>
          )}
        </div>
      </div>
      <div className={styles['view-menu__empty-cta']}>
        {canEdit && (
          <button className="text-link" onClick={actions.RestoreDefaultViews}>
            <i className="fa fa-refresh" style={{ marginRight: '5px' }}>
              Restore default views
            </i>
          </button>
        )}
      </div>
    </div>
  );
};

Empty.propTypes = {
  state: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};

export default function ViewMenu({ state, actions }) {
  const { folders, canEdit } = state;

  // The default folder is ensured (minimal length is 1):
  const isEmpty =
    getAtPath(folders, ['length']) === 1 && getAtPath(folders, [0, 'views', 'length']) === 0;

  return (
    <div className={styles['view-menu-wrapper']}>
      <div className={styles['view-menu']}>
        <div className={styles['view-menu__folders']}>
          {isEmpty ? (
            <Empty state={state} actions={actions} />
          ) : (
            <Folders state={state} actions={actions} />
          )}
        </div>
        {canEdit && (
          <div className={styles['view-menu__actions']}>
            <div className={styles['view-folder__separator']} />
            <button
              className="text-link"
              onClick={() => {
                openInputDialog({
                  title: 'Add folder',
                  confirmLabel: 'Add folder',
                  message: 'Please provide a name for your new folder:',
                  input: { min: 1, max: 32 }
                }).promise.then(actions.CreateFolder);
              }}>
              <i style={{ marginRight: '5px' }}>
                <AddFolderIcon />
              </i>{' '}
              Add folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

ViewMenu.propTypes = {
  state: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};
