import React from 'react';
import PropTypes from 'prop-types';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import AccountDetails from './Account.es6';
import MFA from './MFA.es6';

export default function Settings({ title, onReady }) {
  React.useEffect(onReady, []);

  return (
    <>
      <DocumentTitle title={title} />
      <Workbench>
        <Workbench.Header title={title} />
        <Workbench.Content type="default">
          <Box>
            <AccountDetails />
          </Box>
          <Box>
            <MFA />
          </Box>
        </Workbench.Content>
      </Workbench>
    </>
  );
}

Settings.propTypes = {
  onReady: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
};

const boxClass = css({
  border: `1px solid ${tokens.colorElementLight}`,
  backgroundColor: tokens.colorWhite,
  padding: tokens.spacing2Xl,
  boxShadow: tokens.boxShadowDefault,
  marginBottom: tokens.spacingXl
});

function Box({ children }) {
  return <div className={boxClass}>{children}</div>;
}
