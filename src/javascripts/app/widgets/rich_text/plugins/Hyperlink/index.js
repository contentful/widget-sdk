import React from 'react';
import isHotkey from 'is-hotkey';
import { get, orderBy } from 'lodash';
import { INLINES } from '@contentful/rich-text-types';
import ToolbarIcon from './ToolbarIcon';
import Hyperlink from './Hyperlink';
import { editLink, mayEditLink, toggleLink, hasOnlyHyperlinkInlines } from './Util';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { ScheduleTooltipContent } from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/ScheduleTooltip';

const { HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK } = INLINES;

const styles = {
  tooltipSeparator: css({
    background: tokens.colorTextMid,
    margin: tokens.spacingXs
  })
};

export default ToolbarIcon;

export const getScheduledJobsTooltip = (entityType, node, widgetAPI) => {
  if (
    entityType !== 'Entry' ||
    typeof get(node, 'data.get') !== 'function' ||
    typeof get(widgetAPI, 'jobs.getPendingJobs') !== 'function'
  ) {
    return null;
  }

  const target = node.data.get('target');
  const referencedEntityId = get(target, 'sys.id', undefined);
  const jobs = widgetAPI.jobs
    .getPendingJobs()
    .filter(job => job.entity.sys.id === referencedEntityId);
  const sortedJobs = orderBy(jobs, ['scheduledFor.datetime'], ['asc']);
  return sortedJobs.length ? (
    <>
      <hr className={styles.tooltipSeparator} />
      <ScheduleTooltipContent job={sortedJobs[0]} jobsCount={sortedJobs.length} />
    </>
  ) : null;
};

export const HyperlinkPlugin = ({
  richTextAPI: { widgetAPI, logViewportAction, logShortcutAction }
}) => ({
  renderNode: (props, _editor, next) => {
    const { node, editor, key } = props;
    if (isHyperlink(node.type)) {
      return (
        <Hyperlink
          {...props}
          onClick={event => {
            event.preventDefault(); // Don't follow `href`

            editor.moveToRangeOfNode(node).focus();
            if (mayEditLink(editor.value)) {
              editLink(editor, widgetAPI.dialogs.createHyperlink, logViewportAction);
            }
          }}
          getTooltipData={entityType => getScheduledJobsTooltip(entityType, node, widgetAPI)}
          onEntityFetchComplete={() => logViewportAction('linkRendered', { key })}
        />
      );
    }
    return next();
  },
  onKeyDown: (event, editor, next) => {
    const hotkey = ['mod+k'];

    if (isHotkey(hotkey, event) && hasOnlyHyperlinkInlines(editor.value)) {
      if (mayEditLink(editor.value)) {
        editLink(editor, widgetAPI.dialogs.createHyperlink, logShortcutAction);
      } else {
        toggleLink(editor, widgetAPI.dialogs.createHyperlink, logShortcutAction);
      }
      return;
    }

    return next();
  },
  normalizeNode: (node, editor, next) => {
    if (isHyperlink(node.type) && node.getInlines().size > 0) {
      return () => {
        node
          .getInlines()
          .forEach(inlineNode => editor.unwrapInlineByKey(inlineNode.key, node.type));
      };
    }
    next();
  }
});

function isHyperlink(type) {
  return [HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK].indexOf(type) > -1;
}
