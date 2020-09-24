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
import DeleteEnvironmentAliasModal from './DeleteEnvironmentAliasModal';
import OptIn from './OptIn';
import { aliasStyles } from './SharedStyles';
import { STEPS } from './Utils';
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

function EnvironmentAlias({ environments, currentAliasId, alias }) {
  const targetEnv = environments.find(({ aliases }) => aliases.includes(alias.sys.id));
  const spaceId = environments[0].payload.sys.space.sys.id;
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const canChangeEnvironment = environments.length > 1;
  const canDelete = alias.sys.id !== 'master' && alias.sys.id !== currentAliasId;
  const changeActionWidget = (
    <TextLink
      testId={`openChangeDialog.${alias.sys.id}`}
      onClick={() => {
        changeEnvironmentOpen();
        setChangeModalOpen(true);
      }}
      disabled={!canChangeEnvironment}>
      Change alias target
    </TextLink>
  );

  const deleteActionWidget = (
    <TextLink
      testId={`openDeleteDialog.${alias.sys.id}`}
      linkType="negative"
      onClick={() => setDeleteModalOpen(true)}
      disabled={!canDelete}>
      Delete
    </TextLink>
  );

  return (
    <>
      <Card className={aliasStyles.card} testId={`environmentalias.wrapper.${alias.sys.id}`}>
        <div className={aliasStyles.header}>
          <EnvironmentDetails
            environmentId={alias.sys.id}
            showAliasedTo={false}
            aliasId={alias.sys.id}
            isMaster
            isSelected
            hasCopy={false}
          />
          {canDelete ? (
            deleteActionWidget
          ) : (
            <Tooltip content={<div>You cannot delete this alias.</div>} place="top">
              {deleteActionWidget}
            </Tooltip>
          )}
        </div>
        <Table className={aliasStyles.body}>
          <TableBody>
            <TableRow className={aliasStyles.row}>
              <TableCell className={aliasStyles.cell}>
                <EnvironmentDetails
                  environmentId={targetEnv.id}
                  isSelected
                  isMaster={targetEnv.aliases.includes('master')}
                />
                {canChangeEnvironment ? (
                  changeActionWidget
                ) : (
                  <Tooltip
                    content={
                      <div>
                        You cannot change the alias target.
                        <br />
                        Create a new environment first.
                      </div>
                    }
                    place="top">
                    {changeActionWidget}
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
      <ChangeEnvironmentModal
        alias={alias}
        environments={environments}
        setModalOpen={setChangeModalOpen}
        modalOpen={changeModalOpen}
        spaceId={spaceId}
        targetEnv={targetEnv}
      />

      <DeleteEnvironmentAliasModal
        alias={alias}
        setModalOpen={setDeleteModalOpen}
        modalOpen={deleteModalOpen}
        spaceId={spaceId}
        targetEnv={targetEnv}
      />
    </>
  );
}

EnvironmentAlias.propTypes = {
  environments: PropTypes.arrayOf(
    PropTypes.shape({
      aliases: PropTypes.arrayOf(PropTypes.string).isRequired,
      id: PropTypes.string.isRequired,
      payload: PropTypes.object.isRequired,
    })
  ).isRequired,
  currentAliasId: PropTypes.string,
  alias: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
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

function sortAliases(aliases) {
  return aliases
    .reduce(
      (acc, alias) => {
        alias.sys.id === 'master' ? acc[0].push(alias) : acc[1].push(alias);
        return acc;
      },
      [[], []]
    )
    .reduce(
      (acc, aliasList) => acc.concat(aliasList.sort((a, b) => a.sys.id.localeCompare(b.sys.id))),
      []
    );
}

export default function EnvironmentAliases(props) {
  const { items: environments, spaceId, currentAliasId, allSpaceAliases } = props;
  const [step, setStep] = useState(STEPS.IDLE);

  if (environments.length === 0) {
    return null;
  }

  const aliasComponents = sortAliases(allSpaceAliases).map((alias) => (
    <span data-test-id="environmentalias.span" key={alias.sys.id}>
      <EnvironmentAlias alias={alias} currentAliasId={currentAliasId} environments={environments} />
    </span>
  ));

  if (aliasComponents.length > 0) {
    return (
      <>
        <EnvironmentAliasHeader />
        {aliasComponents}
      </>
    );
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
      <Card className={aliasesStyles.card} testId="environmentalias.wrapper.optin">
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
              testId="environmentalias.start-opt-in"
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
    <span data-test-id="environmentaliases.span">
      <EnvironmentAliasHeader />
      <OptIn
        testId="environmentalias.opt-in"
        step={step}
        setStep={trackedSetStep}
        spaceId={spaceId}
      />
    </span>
  );
}

EnvironmentAliases.propTypes = {
  items: PropTypes.array.isRequired,
  spaceId: PropTypes.string.isRequired,
  currentAliasId: PropTypes.string,
  allSpaceAliases: PropTypes.arrayOf(PropTypes.object).isRequired,
};

EnvironmentAliases.defaultProps = {
  allSpaceAliases: [],
};
