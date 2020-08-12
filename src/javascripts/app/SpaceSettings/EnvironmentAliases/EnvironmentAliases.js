import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TextLink,
  Card,
  Button,
  DisplayText,
  Tooltip,
  Heading,
  Paragraph,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import AliasesIllustration from 'svg/illustrations/aliases-illustration.svg';
import EnvironmentDetails from 'app/common/EnvironmentDetails';
import ChangeEnvironmentModal from './ChangeEnvironmentModal';
import OptIn from './OptIn';
import { aliasStyles } from './SharedStyles';
import { STEPS } from './Utils';
import Feedback from './Feedback';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { optInStep, optInStart, changeEnvironmentOpen } from 'analytics/events/EnvironmentAliases';

const aliasHeaderStyles = {
  header: css({
    fontSize: tokens.fontSizeS,
    textTransform: 'uppercase',
    marginBottom: tokens.spacingM,
    color: tokens.colorTextMid,
    display: 'flex',
    alignItems: 'center',
    '& > span': {
      marginRight: tokens.spacingS,
    },
    '& > svg': {
      transform: 'none !important',
    },
  }),
};

function EnvironmentAliasHeader() {
  return (
    <DisplayText className={aliasHeaderStyles.header} element="h2">
      <span>Environment Aliases</span>
    </DisplayText>
  );
}

function EnvironmentAlias({
  environment: { aliases, id },
  setModalOpen,
  canChangeEnvironment,
  children,
  alias,
}) {
  const changeEnvironment = () => {
    changeEnvironmentOpen();
    setModalOpen(true);
  };
  const actionWidget = (
    <TextLink
      testId="openChangeDialog"
      onClick={changeEnvironment}
      disabled={!canChangeEnvironment}>
      Change alias target
    </TextLink>
  );

  return (
    <Card className={aliasStyles.card} testId="environmentalias.wrapper">
      <div className={aliasStyles.header}>
        <EnvironmentDetails
          environmentId={alias.sys.id}
          showAliasedTo={false}
          aliasId={id}
          isMaster
          isSelected
          hasCopy={false}></EnvironmentDetails>
        {canChangeEnvironment ? (
          actionWidget
        ) : (
          <Tooltip content={children} place="top">
            {actionWidget}
          </Tooltip>
        )}
      </div>
      <Table className={aliasStyles.body}>
        <TableBody>
          <TableRow className={aliasStyles.row}>
            <TableCell>
              <EnvironmentDetails
                environmentId={id}
                isSelected
                isMaster={aliases.includes('master')}></EnvironmentDetails>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
}

EnvironmentAlias.propTypes = {
  environment: PropTypes.shape({
    aliases: PropTypes.arrayOf(PropTypes.string).isRequired,
    id: PropTypes.string.isRequired,
  }).isRequired,
  alias: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
  setModalOpen: PropTypes.func.isRequired,
  canChangeEnvironment: PropTypes.bool,
};

const aliasesStyles = {
  card: css({
    display: 'flex',
    marginBottom: tokens.spacingXl,
  }),
  leftColumn: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  illustration: css({
    flexShrink: '4',
    marginLeft: tokens.spacingM,
    width: '100%',
    height: '100%',
  }),
  buttonBar: css({
    marginTop: 'auto',
  }),
  button: css({
    marginRight: tokens.spacingM,
  }),
  tag: css({
    padding: '0px 4px 0px 5px',
    marginBottom: tokens.spacingM,
    borderRadius: '3px',
    color: tokens.colorWhite,
    backgroundColor: tokens.colorPrimary,
  }),
  header: css({
    marginBottom: tokens.spacingM,
  }),
  paragraph: css({
    margin: `${tokens.spacingM} 0`,
  }),
};

export default function EnvironmentAliases(props) {
  const { items: environments, spaceId, testId, allSpaceAliases } = props;

  const [step, setStep] = useState(STEPS.IDLE);
  const [modalOpen, setModalOpen] = useState(false);

  if (environments.length === 0) {
    return null;
  }

  const aliasComponents = allSpaceAliases
    .map((alias) => {
      const targetEnv = environments.find(({ aliases }) => aliases.includes(alias.sys.id));
      if (targetEnv) {
        return (
          <span data-test-id={testId} key={alias.sys.id}>
            <EnvironmentAliasHeader></EnvironmentAliasHeader>
            <EnvironmentAlias
              alias={alias}
              environment={targetEnv}
              setModalOpen={setModalOpen}
              canChangeEnvironment={environments.some(({ aliases }) => aliases.length <= 0)}>
              <div>
                You cannot change the alias target.
                <br />
                Create a new environment first.
              </div>
            </EnvironmentAlias>
            <Feedback></Feedback>
            <ChangeEnvironmentModal
              alias={alias}
              environments={environments}
              setModalOpen={setModalOpen}
              modalOpen={modalOpen}
              spaceId={spaceId}
              targetEnv={targetEnv}></ChangeEnvironmentModal>
          </span>
        );
      }
    })
    .filter(Boolean);
  if (aliasComponents.length > 0) {
    return aliasComponents;
  }

  const trackedSetStep = (step, track = true) => {
    if (track) optInStep(step);
    setStep(step);
  };

  const startOptIn = () => {
    optInStart();
    trackedSetStep(STEPS.FIRST_ALIAS);
  };

  if (step === STEPS.IDLE) {
    return (
      <Card className={aliasesStyles.card} testId={testId}>
        <div className={aliasesStyles.leftColumn}>
          <Heading className={aliasesStyles.header} element="h2">
            Introducing environment aliases
          </Heading>
          <Paragraph>
            Environment aliases allow you to choose which environment serves your production
            content. Quickly roll out updates, and just as easily roll them back.
          </Paragraph>
          <Paragraph className={aliasesStyles.paragraph}>
            Go ahead and set up the environment alias for your master environment.
          </Paragraph>
          <span className={aliasesStyles.buttonBar}>
            <Button
              testId="environmentaliases.start-opt-in"
              className={aliasesStyles.button}
              onClick={startOptIn}>
              Set up your first alias
            </Button>
            <ExternalTextLink href="https://www.contentful.com/developers/docs/concepts/environment-aliases/">
              Learn more
            </ExternalTextLink>
          </span>
        </div>
        <AliasesIllustration className={aliasesStyles.illustration} />
      </Card>
    );
  }

  return (
    <span data-test-id={testId}>
      <EnvironmentAliasHeader></EnvironmentAliasHeader>
      <OptIn
        testId="environmentaliases.opt-in"
        step={step}
        setStep={trackedSetStep}
        spaceId={spaceId}></OptIn>
    </span>
  );
}

EnvironmentAliases.propTypes = {
  testId: PropTypes.string,
  items: PropTypes.array.isRequired,
  spaceId: PropTypes.string.isRequired,
  allSpaceAliases: PropTypes.arrayOf(PropTypes.object),
};

EnvironmentAliases.defaultProps = {
  testId: 'environmentaliases.wrapper',
  allSpaceAliases: [],
};
