import {
  Card,
  CardActions,
  Paragraph,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import tokens from '@contentful/forma-36-tokens';
import { AppBundleData } from '../AppEditor';
import { css } from 'emotion';
import { noop } from 'lodash';
import React from 'react';

const styles = {
  card: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
  cardInfo: css({
    flexGrow: 1,
  }),
  cardTitle: css({
    color: tokens.colorTextDark,
    fontWeight: 'bold',
  }),
  bundleComment: css({
    fontWeight: 'bold',
  }),
};

interface BundleCardProps {
  bundle: AppBundleData;
  className?: string;
  setNewAppBundle?: (bundle: AppBundleData) => void;
  children?: React.ReactElement;
}

export const BundleCard: React.FC<BundleCardProps> = ({
  bundle,
  setNewAppBundle,
  className = '',
  children,
}) => {
  return (
    <Card
      className={`
        ${styles.card}
        ${className}
    `}>
      <div data-test-id="app-bundle.card" className={styles.cardInfo}>
        <Paragraph>
          <span className={styles.cardTitle}>
            <RelativeDateTime value={bundle.sys.createdAt} />
            {': '}
          </span>
          <span className={styles.bundleComment}>{bundle.comment ?? 'No bundle comment'}</span>
        </Paragraph>
        {/* TODO fetch this data and render it correctly */}
        {bundle.sys.createdBy.sys.id}
      </div>
      {children}
      <CardActions className={css({ display: 'flex' })}>
        <DropdownList>
          {setNewAppBundle && (
            <DropdownListItem
              onClick={() => {
                setNewAppBundle(bundle);
              }}>
              Activate bundle
            </DropdownListItem>
          )}
          <DropdownListItem onClick={noop /* TODO: implement in EXT-2623 */}>
            Inspect uploaded files
          </DropdownListItem>
          <DropdownListItem onClick={noop /* TODO: implement */}>Delete bundle</DropdownListItem>
        </DropdownList>
      </CardActions>
    </Card>
  );
};
