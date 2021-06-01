import React from 'react';
import moment from 'moment';
import isHotkey from 'is-hotkey';
import { StatusTag } from './StatusTag';
import { StatusTransition } from './StatusTransition';
import { getEntryTitle, getAssetTitle } from 'classes/EntityFieldValueHelpers';
import { ActionPerformerName } from 'core/components/ActionPerformerName';
import SecretiveLink from 'components/shared/SecretiveLink';
import EntityStateLink from 'app/common/EntityStateLink';
import {
  EntryProps,
  AssetProps,
  LocaleProps,
  MetaLinkProps,
  ScheduledActionProps,
} from 'contentful-management/types';
import { TableCell, TableRow } from '@contentful/forma-36-react-components';
import { ContentType } from 'core/services/SpaceEnvContext/types';
import { Release } from '@contentful/types';
import { css } from 'emotion';

const styles = {
  scheduledActionRow: css({
    cursor: 'pointer',
  }),
};

type ScheduledActionsWithExistingEntityRowProps = {
  scheduledAction: ScheduledActionProps;
  user: { sys: MetaLinkProps };
  entity: EntryProps | AssetProps | Release;
  contentType: ContentType;
  defaultLocale: LocaleProps;
  showStatusTransition: boolean;
};

function ScheduledActionWithExsitingEntityRow({
  scheduledAction,
  user,
  entity,
  contentType,
  defaultLocale,
  showStatusTransition,
}: ScheduledActionsWithExistingEntityRowProps) {
  const entityTypeToTitle = {
    Entry: getEntryTitle({
      entry: entity,
      contentType,
      internalLocaleCode: defaultLocale.internal_code,
      defaultInternalLocaleCode: defaultLocale.internal_code,
      defaultTitle: 'Untitled',
    }),
    Release: (entity as Release).title,
    Asset: getAssetTitle({
      asset: entity,
      internalLocaleCode: defaultLocale.internal_code,
      defaultInternalLocaleCode: defaultLocale.internal_code,
      defaultTitle: 'Untitled',
    }),
  };

  return (
    <EntityStateLink entity={entity}>
      {({ onClick, getHref }) => (
        <TableRow
          className={styles.scheduledActionRow}
          data-test-id="scheduled-job"
          tabIndex={0}
          onClick={(e) => {
            onClick(e);
          }}
          onKeyDown={(e: unknown) => {
            if (isHotkey(['enter', 'space'], e as KeyboardEvent)) {
              onClick(e);
              (e as KeyboardEvent).preventDefault();
            }
          }}>
          <TableCell>
            {moment
              .utc(scheduledAction.scheduledFor.datetime)
              .local()
              .format('ddd, MMM Do, YYYY - hh:mm A')}
          </TableCell>
          <TableCell>
            {' '}
            <SecretiveLink className={undefined} href={getHref()}>
              {entityTypeToTitle[entity.sys.type]}
            </SecretiveLink>
          </TableCell>
          <TableCell>{contentType && contentType.name}</TableCell>
          <TableCell>
            <ActionPerformerName link={user} />
          </TableCell>
          <TableCell>
            {showStatusTransition ? (
              <StatusTransition entity={entity} />
            ) : (
              <StatusTag scheduledAction={scheduledAction} />
            )}
          </TableCell>
        </TableRow>
      )}
    </EntityStateLink>
  );
}

type ScheduledActionWithMissingEntityRowProps = {
  scheduledAction: ScheduledActionProps;
  user: { sys: MetaLinkProps };
};

function ScheduledActionWithMissingEntityRow({
  scheduledAction,
  user,
}: ScheduledActionWithMissingEntityRowProps) {
  return (
    <TableRow data-test-id="scheduled-job">
      <TableCell>
        {moment
          .utc(scheduledAction.scheduledFor.datetime)
          .local()
          .format('ddd, MMM Do, YYYY - hh:mm A')}
      </TableCell>
      <TableCell>Entity missing or inaccessible</TableCell>
      <TableCell />
      <TableCell>
        <ActionPerformerName link={user} />
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

export { ScheduledActionWithExsitingEntityRow, ScheduledActionWithMissingEntityRow };
