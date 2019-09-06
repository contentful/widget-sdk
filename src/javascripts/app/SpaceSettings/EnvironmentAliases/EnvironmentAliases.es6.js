import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  Tag,
  TextLink,
  Card,
  Button,
  DisplayText,
  Tooltip,
  Heading,
  Paragraph
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import AliasesIllustration from 'svg/aliases-illustration.es6';
import EnvironmentDetails from 'app/common/EnvironmentDetails.es6';
import ChangeEnvironmentModal from './ChangeEnvironmentModal.es6';
import OptIn from './OptIn.es6';
import { aliasStyles } from './SharedStyles.es6';
import { STEPS } from './Utils.es6';
import Feedback from './Feedback.es6';
import ExternalTextLink from 'app/common/ExternalTextLink.es6';
import {
  optInStep,
  optInStart,
  changeEnvironmentOpen
} from 'analytics/events/EnvironmentAliases.es6';

const aliasHeaderStyles = {
  alphaTag: css({
    fontSize: tokens.fontSizeS,
    color: tokens.colorBlueLight,
    marginLeft: 'auto'
  }),
  header: css({
    fontSize: tokens.fontSizeS,
    textTransform: 'uppercase',
    marginBottom: tokens.spacingM,
    color: tokens.colorTextMid,
    display: 'flex',
    alignItems: 'center',
    '& > span': {
      marginRight: tokens.spacingS
    },
    '& > svg': {
      transform: 'none !important'
    }
  })
};

function EnvironmentAliasHeader() {
  return (
    <DisplayText className={aliasHeaderStyles.header} element="h2">
      <span>Environment Aliases</span>
      <Tag className={aliasHeaderStyles.alphaTag}>ALPHA</Tag>
    </DisplayText>
  );
}

function EnvironmentAlias({
  environment: { aliases, id },
  setModalOpen,
  canChangeEnvironment,
  alias
}) {
  const changeEnvironment = () => {
    changeEnvironmentOpen()
    setModalOpen(true);
  };
  const content = (
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
          content
        ) : (
          <Tooltip
            content={
              <div>
                You cannot change the environment.
                <br />
                Create a new environment first.
              </div>
            }
            place="top">
            {content}
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
    id: PropTypes.string.isRequired
  }).isRequired,
  alias: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.string
    })
  }).isRequired,
  setModalOpen: PropTypes.func.isRequired,
  canChangeEnvironment: PropTypes.bool.isRequired
};

const aliasesStyles = {
  card: css({
    display: 'flex',
    marginBottom: tokens.spacingXl
  }),
  leftColumn: css({
    display: 'flex',
    flexDirection: 'column'
  }),
  illustration: css({
    flexShrink: '0',
    marginLeft: tokens.spacingM
  }),
  buttonBar: css({
    marginTop: 'auto'
  }),
  button: css({
    marginRight: tokens.spacingM
  }),
  tag: css({
    padding: '0px 4px 0px 5px',
    marginBottom: tokens.spacingM,
    borderRadius: '3px',
    color: tokens.colorWhite,
    backgroundColor: tokens.colorPrimary
  })
};

export default function EnvironmentAliases(props) {
  const { items: environments, spaceData, testId, allSpaceAliases } = props;

  const [step, setStep] = useState(STEPS.IDLE);
  const [modalOpen, setModalOpen] = useState(false);

  if (environments.length === 0) {
    return null;
  }

  const aliasComponents = allSpaceAliases
    .map(alias => {
      const targetEnv = environments.find(({ aliases }) => aliases.includes(alias.sys.id));
      if (targetEnv) {
        return (
          <span data-test-id={testId} key={alias.sys.id}>
            <EnvironmentAliasHeader></EnvironmentAliasHeader>
            <EnvironmentAlias
              alias={alias}
              environment={targetEnv}
              setModalOpen={setModalOpen}
              canChangeEnvironment={environments.some(
                ({ aliases }) => aliases.length <= 0
              )}></EnvironmentAlias>
            <Feedback></Feedback>
            <ChangeEnvironmentModal
              alias={alias}
              environments={environments}
              setModalOpen={setModalOpen}
              modalOpen={modalOpen}
              spaceId={spaceData.sys.id}
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
          <div>
            <Tag className={aliasesStyles.tag}>ALPHA</Tag>
          </div>
          <Heading element="h2">Supercharge your Environments with Aliases</Heading>
          <Paragraph>
            We&apos;ve just launched Aliases, which allow you to make any Environment your
            production Environment. Easily roll-out updates, and just as easily roll them back.
          </Paragraph>
          <span className={aliasesStyles.buttonBar}>
            <Button
              testId="environmentaliases.start-opt-in"
              className={aliasesStyles.button}
              onClick={startOptIn}>
              Create first Alias
            </Button>
            <ExternalTextLink href="https://www.contentful.com/developers/docs/concepts/environment-aliases/">
              Learn more
            </ExternalTextLink>
          </span>
        </div>
        <AliasesIllustration className={aliasesStyles.illustration}></AliasesIllustration>
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
        spaceId={spaceData.sys.id}></OptIn>
    </span>
  );
}

EnvironmentAliases.propTypes = {
  testId: PropTypes.string,
  items: PropTypes.array.isRequired,
  spaceData: PropTypes.object.isRequired,
  allSpaceAliases: PropTypes.arrayOf(PropTypes.object)
};

EnvironmentAliases.defaultProps = {
  testId: 'environmentaliases.wrapper'
};
