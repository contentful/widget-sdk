import React, { useState, useEffect, useCallback } from 'react';
import isArray from 'lodash/isArray';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink';
import StateRedirect from 'app/common/StateRedirect';
import DeeplinkSelectSpaceEnv from './DeeplinkSelect/DeeplinkSelectSpaceEnv';
import DeeplinkSelectApp from './DeeplinkSelect/DeeplinkSelectApp';
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
    marginLeft: tokens.spacingS,
  }),
};

function DeeplinkRedirectingMessage() {
  return (
    <div className={styles.messageContainer}>
      <Heading as="h3">Redirecting</Heading>
      <Spinner className={styles.spinner} />
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
  selectApp: 'select_app',
  noSpaceError: 'no_space_error',
};

const getStatusFromError = (error) => {
  switch (true) {
    case error.isOnboardingError:
      return PageStatuses.onboardingError;
    case error.isNoSpaceError:
      return PageStatuses.noSpaceError;
  }

  return PageStatuses.notExistError;
};

export function useDeeplinkPage({ searchParams }) {
  const [status, setStatus] = useState(PageStatuses.redirecting);
  const [redirect, setRedirect] = useState(null);
  const [deeplinkOptions, setDeeplinkOptions] = useState({});

  const resolveDeeplink = useCallback(async () => {
    const { link, ...otherParams } = searchParams;
    const result = await resolveLink(link, otherParams);

    if (result.error) {
      setStatus(getStatusFromError(result.error));
    } else {
      if (result.deeplinkOptions?.selectSpace || result.deeplinkOptions?.selectEnvironment) {
        setDeeplinkOptions(result.deeplinkOptions);
        setStatus(PageStatuses.selectSpaceEnv);
      } else if (result.deeplinkOptions?.selectApp) {
        setDeeplinkOptions(result.deeplinkOptions);
        setStatus(PageStatuses.selectApp);
      }
      setRedirect({
        path: isArray(result.path) ? result.path.join('.') : result.path,
        params: result.params,
        options: { location: 'replace' },
      });
    }
  }, [searchParams]);

  const abort = () => {
    window.location.href = window.location.origin;
  };

  const updateRedirectLink = useCallback(
    ({ spaceId, environmentId, definitionId }) => {
      setRedirect({
        ...redirect,
        params: {
          ...redirect.params,
          spaceId,
          environmentId,
          definitionId,
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

export default function DeeplinkPage({ searchParams, href, marketplaceApps }) {
  const { status, redirect, deeplinkOptions, updateRedirectLink, abort } = useDeeplinkPage({
    searchParams,
  });

  return (
    <Workbench>
      <Workbench.Content type="text">
        {status === PageStatuses.redirecting && <DeeplinkRedirectingMessage />}
        {status === PageStatuses.redirecting && redirect ? (
          <StateRedirect path={redirect.path} params={redirect.params} options={redirect.options} />
        ) : null}
        {status === PageStatuses.noSpaceError && (
          <StateRedirect path={['home']} options={{ location: 'replace' }} />
        )}
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
        {status === PageStatuses.selectApp && (
          <DeeplinkSelectApp
            redirect={redirect}
            onCancel={() => {
              abort();
            }}
            onContinue={(definitionId) => {
              updateRedirectLink({ definitionId });
            }}
          />
        )}
        {status === PageStatuses.selectSpaceEnv && (
          <DeeplinkSelectSpaceEnv
            {...deeplinkOptions}
            href={href}
            searchParams={searchParams}
            marketplaceApps={marketplaceApps}
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
