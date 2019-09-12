import React, { useState, useEffect, useCallback } from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink.es6';

import StateRedirect from 'app/common/StateRedirect.es6';
import DeeplinkSelectSpaceEnv from './DeeplinkSelectSpaceEnv.es6';
import { Heading, Paragraph, Typography } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import { resolveLink } from './resolver.es6';

const styles = {
  messageContainer: css({
    marginTop: '40%',
    textAlign: 'center'
  })
};

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
  subtitle: PropTypes.any
};

const PageStatuses = {
  redirecting: 'redirecting',
  onboardingError: 'onboarding_error',
  notExistError: 'not_exist_error',
  selectSpaceEnv: 'select_space_env'
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
        to: result.path.join('.'),
        params: result.params,
        options: { location: 'replace' }
      });
    }
  }, [searchParams]);

  const updateRedirectLink = useCallback(
    ({ spaceId, environmentId }) => {
      setRedirect({
        ...redirect,
        params: {
          ...redirect.params,
          spaceId,
          environmentId
        }
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
    updateRedirectLink,
    deeplinkOptions
  };
}

export default function DeeplinkPage(props) {
  const { status, redirect, deeplinkOptions, updateRedirectLink } = useDeeplinkPage({
    searchParams: props.searchParams
  });

  return (
    <Workbench>
      <Workbench.Content type="text">
        {status === PageStatuses.redirecting && <DeeplinkPageMessage title="Redirecting…" />}
        {status === PageStatuses.notExistError && (
          <DeeplinkPageMessage
            title="The link you provided is broken or does not exist"
            testId="deeplink-generic-error"
            subtitle={
              <React.Fragment>
                We are notified about it. You can contact our support or{' '}
                <StateLink to="home">go to the main page</StateLink>.
              </React.Fragment>
            }
          />
        )}
        {status === PageStatuses.onboardingError && (
          <DeeplinkPageMessage
            testId="deeplink-onboarding-error"
            title="Unfortunately, we didn't find your onboarding space."
            subtitle={<StateLink to="home">Go to the main page.</StateLink>}
          />
        )}
        {status === PageStatuses.selectSpaceEnv && (
          <DeeplinkSelectSpaceEnv
            {...deeplinkOptions}
            onComplete={({ spaceId, environmentId }) => {
              updateRedirectLink({ spaceId, environmentId });
            }}
          />
        )}
        {redirect && status === PageStatuses.redirecting ? <StateRedirect {...redirect} /> : null}
      </Workbench.Content>
    </Workbench>
  );
}

DeeplinkPage.propTypes = {
  searchParams: PropTypes.object.isRequired
};
