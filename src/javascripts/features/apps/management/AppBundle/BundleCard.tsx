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
import { AppBundleDataWithCreator, AppBundleData } from '../AppEditor';
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
  userAvatar: css({
    borderRadius: '100%',
    background: tokens.colorTextBase,
    width: '20px',
    height: '20px',
    marginRight: tokens.spacingXs,
  }),
  user: css({
    marginTop: tokens.spacing2Xs,
    display: 'flex',
    alignItems: 'center',
  }),
};

interface BundleCardProps {
  bundle: AppBundleDataWithCreator;
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
            <span className={styles.user}>
              <img
                alt=""
                role="presentation"
                className={styles.userAvatar}
                src={bundle.sys.createdBy.avatarUrl}
              />
              {`${bundle.sys.createdBy.firstName} ${bundle.sys.createdBy.lastName}`}
            </span>
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
