import React from 'react';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  SkeletonContainer,
  SkeletonDisplayText,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import moment from 'moment/moment';
import { AppBundleData } from './HostingDropzone';
import { getAppBundle } from './appHostingApi';
import { useAsync } from 'core/hooks';
import { AppDefinitionWithBundle } from './AppHosting';

const styles = {
  dropDown: css({
    marginBottom: tokens.spacingM,
  }),
  bundleInfo: css({
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorTextDark,
  }),
  bundleMessage: css({
    color: tokens.colorTextLight,
  }),
};

interface HostingDropdownProps {
  definition: AppDefinitionWithBundle;
}

export function HostingDropdown({ definition }: HostingDropdownProps) {
  const [isOpen, setOpen] = React.useState(false);

  const bundleId = definition.bundle?.sys.id;

  const fetchBundle = React.useCallback(async () => {
    if (bundleId) {
      return await getAppBundle(definition.sys.organization.sys.id, definition.sys.id, bundleId);
    }
  }, [definition.sys.organization.sys.id, definition.sys.id, bundleId]);

  const { data, isLoading } = useAsync<AppBundleData | undefined>(fetchBundle);

  const uploadDateString = React.useMemo(() => {
    if (data) {
      return moment(data.sys.createdAt).format('ll');
    }
    return null;
  }, [data]);

  if (!data && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <SkeletonContainer svgHeight="3.5rem">
        <SkeletonDisplayText lineHeight="2.5rem" width={300} />
      </SkeletonContainer>
    );
  }

  return (
    <Dropdown
      className={styles.dropDown}
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      toggleElement={
        <Button
          disabled={!data}
          buttonType="muted"
          indicateDropdown
          onClick={() => setOpen(!isOpen)}>
          <span className={styles.bundleInfo}>
            {uploadDateString}:{' '}
            <span className={styles.bundleMessage}>{data?.comment || 'No upload message'}</span>
          </span>
        </Button>
      }>
      <DropdownList>
        <DropdownListItem className={styles.bundleInfo}>
          {uploadDateString}:{' '}
          <span className={styles.bundleMessage}>{data?.comment || 'No upload message'}</span>
        </DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
}
