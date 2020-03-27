import React, { useState, useEffect, useCallback } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink';

import StateRedirect from 'app/common/StateRedirect';
import DeeplinkSelectSpaceEnv from './DeeplinkSelectSpaceEnv/DeeplinkSelectSpaceEnv';
import {
  Heading,
  Paragraph,
  Typography,
  Spinner,
  Workbench,
} from '@contentful/forma-36-react-components';
import { resolveLink } from './resolver';

const styles = {
  messageContainer: css({
    marginTop: '40%',
    textAlign: 'center',
  }),
  spinner: css({
    marginBottom: tokens.spacingS,
  }),
};

function DeeplinkRedirectingMessage() {
  return (
    <div className={styles.messageContainer}>
      <Spinner className={styles.spinner} />
      <Heading as="h3">Redirecting…</Heading>
    </div>
  );
}

function DeeplinkPageMessage(props) {
  return (
    <div data-test-id={props.testId} className={styles.messageContainer}>
      <Typography>
        <Heading as="h3">{props.title}</Heading>
        <Paragraph>{props.subtitle}</Paragraph>
      </Typography>
    </div>
  );
}

DeeplinkPageMessage.propTypes = {
  testId: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.any,
};

const PageStatuses = {
  redirecting: 'redirecting',
  onboardingError: 'onboarding_error',
  notExistError: 'not_exist_error',
  selectSpaceEnv: 'select_space_env',
};

export function useDeeplinkPage({ searchParams }) {
  const [status, setStatus] = useState(PageStatuses.redirecting);
  const [redirect, setRedirect] = useState(null);
  const [deeplinkOptions, setDeeplinkOptions] = useState({});

  const resolveDeeplink = useCallback(async () => {
    const { link, ...otherParams } = searchParams;
    const result = await resolveLink(link, otherParams);
    if (!result.path) {
      setStatus(result.onboarding ? PageStatuses.onboardingError : PageStatuses.notExistError);
    } else {
      if (result.deeplinkOptions) {
        setDeeplinkOptions(result.deeplinkOptions);
        setStatus(PageStatuses.selectSpaceEnv);
      }
      setRedirect({
        path: result.path.join('.'),
        params: result.params,
        options: { location: 'replace' },
      });
    }
  }, [searchParams]);

  const abort = () => {
    window.location.href = window.location.origin;
  };

  const updateRedirectLink = useCallback(
    ({ spaceId, environmentId }) => {
      setRedirect({
        ...redirect,
        params: {
          ...redirect.params,
          spaceId,
          environmentId,
        },
      });
      setStatus(PageStatuses.redirecting);
    },
    [redirect]
  );

  useEffect(() => {
    resolveDeeplink();
  }, [resolveDeeplink]);

  return {
    status,
    redirect,
    abort,
    updateRedirectLink,
    deeplinkOptions,
  };
}

export default function DeeplinkPage(props) {
  const { status, redirect, deeplinkOptions, updateRedirectLink, abort } = useDeeplinkPage({
    searchParams: props.searchParams,
  });

  return (
    <Workbench>
      <Workbench.Content type="text">
        {status === PageStatuses.redirecting && <DeeplinkRedirectingMessage />}
        {status === PageStatuses.redirecting && redirect ? (
          <StateRedirect path={redirect.path} params={redirect.params} options={redirect.options} />
        ) : null}
        {status === PageStatuses.notExistError && (
          <DeeplinkPageMessage
            title="The link you provided is broken or does not exist"
            testId="deeplink-generic-error"
            subtitle={
              <React.Fragment>
                We are notified about it. You can contact our support or{' '}
                <StateLink path="home">go to the main page</StateLink>.
              </React.Fragment>
            }
          />
        )}
        {status === PageStatuses.onboardingError && (
          <DeeplinkPageMessage
            testId="deeplink-onboarding-error"
            title="Unfortunately, we didn't find your onboarding space."
            subtitle={<StateLink path="home">Go to the main page.</StateLink>}
          />
        )}
        {status === PageStatuses.selectSpaceEnv && (
          <DeeplinkSelectSpaceEnv
            {...deeplinkOptions}
            href={props.href}
            searchParams={props.searchParams}
            marketplaceApps={props.marketplaceApps}
            onContinue={({ spaceId, environmentId }) => {
              updateRedirectLink({ spaceId, environmentId });
            }}
            onCancel={() => {
              abort();
            }}
          />
        )}
      </Workbench.Content>
    </Workbench>
  );
}

DeeplinkPage.propTypes = {
  href: PropTypes.string.isRequired,
  searchParams: PropTypes.object.isRequired,
  marketplaceApps: PropTypes.object.isRequired,
};
