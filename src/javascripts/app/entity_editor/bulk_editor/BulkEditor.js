import React, { useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { BulkEditorHeader } from './BulkEditorHeader';
import Loader from 'ui/Loader';
import { BulkEntityEditor } from './BulkEntityEditor';
import { BulkEditorSidebar } from './BulkEditorSidebar';
import { assignLocaleData } from 'app/entity_editor/setLocaleData';
import { getModule } from 'core/NgRegistry';
import _ from 'lodash';
import * as K from 'core/utils/kefir';
import * as List from 'utils/List';

import * as DataLoader from 'app/entity_editor/DataLoader';
import * as Tracking from 'app/entity_editor/bulk_editor/Tracking';
import { Workbench } from '@contentful/forma-36-react-components';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const heightWithoutHeader = 'calc(100% - 71px)';

const styles = {
  workbench: css({
    '& > div': {
      flexWrap: 'wrap',
      height: '100%',
      overflow: 'hidden',
    },
  }),
  workbenchContent: css({
    padding: 0,
    height: heightWithoutHeader,
    position: 'relative',
    '& > div': {
      height: '100%',
    },
  }),
  workbenchSidebar: css({
    minHeight: heightWithoutHeader,
  }),
  bulkEntityEditorWrapper: css({
    overflowY: 'scroll',
    minWidth: tokens.spacingM,
  }),
  emptyState: css({
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    margin: 'auto',
    textAlign: 'center',
    color: tokens.colorTextBase,
    fontSize: tokens.fontSizeXl,
    lineHeight: 1.5,
  }),
  hidden: css({
    visibility: 'hidden',
  }),
};

const getIds = (links$) =>
  links$.map((links) => {
    const linksArray = Array.isArray(links) ? links : [links];
    return linksArray.map(_.property('sys.id')).filter(_.isString);
  });

const scrollToFocused = (ref) => {
  if (ref) {
    setTimeout(() => {
      ref.querySelector('input')?.focus();
      ref.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }
};

export const BulkEditor = (props) => {
  const { referenceContext = props.getReferenceContext(), trackLoadEvent } = props;
  const spaceContext = useMemo(() => getModule('spaceContext'), []);

  const {
    focusIndex = null,
    editorSettings,
    parentId,
    links$,
    field,
    close,
    remove,
    add,
  } = referenceContext;

  const editorsLoaded = useRef(0);

  const focusedRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(focusIndex);

  const { current: track } = useRef(Tracking.create(parentId, links$));
  const { current: localeData } = useRef(assignLocaleData({}, { isBulkEditor: true }));

  const [isLoaded, setIsLoaded] = useState(false);
  const [entityContexts, setEntityContexts] = useState([]);

  // List of IDs for the linked entries
  const ids$ = getIds(links$);

  useEffect(() => {
    track.open();
    const entityContexts$ = ids$.map((ids) =>
      List.makeKeyed(ids, _.identity).map(({ value: id, key }) => ({ id, key }))
    );

    K.onValue(entityContexts$, setEntityContexts);

    return () => track.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const linkCount = entityContexts.length;

  const addLinks = async (links) => {
    setFocusedIndex(linkCount);
    const added = await Promise.all(links.map((link) => add(link)));
    scrollToFocused(focusedRef.current);
    return added;
  };

  const loadEditorData = DataLoader.makePrefetchEntryLoader(spaceContext, ids$);

  const removeByKey = (key) => () => {
    const index = entityContexts.findIndex((entityContext) => entityContext.key === key);
    if (index > -1) {
      remove(index);
    }
  };

  const setFocusedRef = (i) => (ref) => {
    if (focusedIndex === i) {
      focusedRef.current = ref;
    }
  };

  const onEditorInitialized = () => {
    const allEditorsLoaded = (editorsLoaded.current += 1) >= linkCount;
    if (allEditorsLoaded) {
      setIsLoaded(true);
    }
    scrollToFocused(focusedRef.current);
  };

  const onCloseWithReason = (reason) => () => close(reason);

  const bulkEditorContext = {
    editorSettings,
    track,
    trackLoadEvent,
    loadEditorData,
  };

  return (
    <Workbench className={styles.workbench}>
      <BulkEditorHeader
        fieldName={field.name}
        linkCount={linkCount}
        onClose={onCloseWithReason('bulk_editor_close')}
        onBack={onCloseWithReason('arrow_back')}
      />
      <Workbench.Content className={styles.workbenchContent}>
        {!isLoaded && linkCount > 0 && <Loader testId="bulk-editor-loader" isShown />}
        {linkCount === 0 && (
          <div className={styles.emptyState} data-test-id="bulk-editor-empty-state">
            There are no entries linked yet.
          </div>
        )}
        <div className={styles.bulkEntityEditorWrapper}>
          {entityContexts.map((entityContext, i) => (
            <div
              key={entityContext.key}
              ref={setFocusedRef(i)}
              className={cx({ [styles.hidden]: !isLoaded })}
              data-test-id="bulk-editor-entity"
              data-entity-id={entityContext.id}>
              <BulkEntityEditor
                localeData={localeData}
                entityContext={entityContext}
                onRemove={removeByKey(entityContext.key)}
                onEditorInitialized={onEditorInitialized}
                hasInitialFocus={focusedIndex === i}
                bulkEditorContext={bulkEditorContext}
              />
            </div>
          ))}
        </div>
      </Workbench.Content>
      <Workbench.Sidebar position="right" className={styles.workbenchSidebar}>
        <BulkEditorSidebar linkCount={linkCount} field={field} addLinks={addLinks} track={track} />
      </Workbench.Sidebar>
    </Workbench>
  );
};

BulkEditor.propTypes = {
  referenceContext: PropTypes.object,
  getReferenceContext: PropTypes.func,
  trackLoadEvent: PropTypes.func,
};
