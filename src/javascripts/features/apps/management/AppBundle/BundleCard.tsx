import {
  Card,
  CardActions,
  Paragraph,
  DropdownList,
  DropdownListItem,
  Notification,
  Spinner,
} from '@contentful/forma-36-react-components';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import tokens from '@contentful/forma-36-tokens';
import { AppBundleData } from '../AppEditor';
import { css } from 'emotion';
import { noop } from 'lodash';
import { deleteAppBundle } from '../AppEditor/appHostingApi';
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
  spinner: css({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  }),
};

interface BundleCardProps {
  bundle: AppBundleData;
  className?: string;
  setNewAppBundle?: (bundle: AppBundleData) => void;
  removeBundle?: (bundle) => void;
  children?: React.ReactElement;
}

export const BundleCard: React.FC<BundleCardProps> = ({
  bundle,
  setNewAppBundle,
  removeBundle,
  className = '',
  children,
}) => {
  const [isBeingDeleted, setIsBeingDeleted] = React.useState(false);

  return (
    <Card
      className={`
        ${styles.card}
        ${className}
    `}>
      {isBeingDeleted ? (
        <div className={styles.spinner}>
          <Spinner />
        </div>
      ) : (
        <>
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
              {removeBundle && (
                <DropdownListItem
                  onClick={async () => {
                    setIsBeingDeleted(true);
                    try {
                      await deleteAppBundle(
                        bundle.sys.organization.sys.id,
                        bundle.sys.appDefinition.sys.id,
                        bundle.sys.id
                      );
                      removeBundle(bundle);
                    } catch (e) {
                      Notification.error("Something went wrong. Couldn't delete the app bundle.");
                    }
                    setIsBeingDeleted(false);
                  }}>
                  Delete bundle
                </DropdownListItem>
              )}
            </DropdownList>
          </CardActions>
        </>
      )}
    </Card>
  );
};
