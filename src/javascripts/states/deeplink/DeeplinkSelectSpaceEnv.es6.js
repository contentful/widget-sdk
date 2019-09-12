import React, { useEffect, useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';
import { getSpaceInfo, getAllEnviroments } from './utils.es6';
import {
  Card,
  Subheading,
  Typography,
  Form,
  SelectField,
  Option,
  Button
} from '@contentful/forma-36-react-components';

const actionTypes = {
  initialize: 'initialize',
  selectSpace: 'select-space',
  selectEnvironment: 'select-env',
  updateEnvsList: 'update-envs-list'
};

const reducer = createImmerReducer({
  [actionTypes.initialize]: (state, action) => {
    const { space, spaces, envs } = action.payload;
    state.loading = false;
    state.spaceId = space.sys.id;
    state.environmentId = 'master';

    const orgs = {};
    spaces.forEach(space => {
      const orgId = space.organization.sys.id;
      const orgName = space.organization.name;
      if (orgs[orgId]) {
        orgs[orgId].spaces.push(space);
      } else {
        orgs[orgId] = {
          id: orgId,
          name: orgName,
          spaces: [space]
        };
      }
    });
    state.organizations = Object.keys(orgs).map(key => orgs[key]);
    state.environments = envs;
  },
  [actionTypes.selectEnvironment]: (state, action) => {
    state.environmentId = action.payload.environmentId;
  },
  [actionTypes.selectSpace]: (state, action) => {
    state.spaceId = action.payload.spaceId;
    state.environmentId = 'master';
  },
  [actionTypes.updateEnvsList]: (state, action) => {
    const { envs } = action.payload;
    state.environments = envs;
  }
});

export function useComponentState() {
  const [state, dispatch] = useReducer(reducer, {
    loading: true,
    organizations: [],
    environments: [],
    error: null,
    spaceId: '',
    environmentId: 'master'
  });

  const fetchInitialData = useCallback(async () => {
    const { space, spaces } = await getSpaceInfo();
    const envs = await getAllEnviroments(space.sys.id);
    dispatch({ type: actionTypes.initialize, payload: { space, spaces, envs } });
  }, [dispatch]);

  const selectSpace = useCallback(async id => {
    dispatch({ type: actionTypes.selectSpace, payload: { spaceId: id } });
    const envs = await getAllEnviroments(id);
    dispatch({ type: actionTypes.updateEnvsList, payload: { envs } });
  }, []);

  const selectEnvironment = useCallback(id => {
    dispatch({ type: actionTypes.selectEnvironment, payload: { environmentId: id } });
  }, []);

  return {
    state,
    fetchInitialData,
    selectSpace,
    selectEnvironment
  };
}

export default function DeeplinkSelectSpaceEnv(props) {
  const { state, fetchInitialData, selectEnvironment, selectSpace } = useComponentState();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <Card padding="large">
      <Typography>
        <Subheading>
          {props.selectEnvironment === true ? 'Select space & environment' : 'Select space'}
        </Subheading>
      </Typography>
      <Form>
        {props.selectSpace === true && (
          <SelectField
            selectProps={{
              isDisabled: state.loading,
              testId: 'deeplink-select-space'
            }}
            labelText="Space"
            required
            id="space"
            name="space"
            value={state.spaceId}
            onChange={e => {
              selectSpace(e.target.value);
            }}>
            <Option value="">Select space</Option>
            {state.organizations.map(({ id, name, spaces }) => {
              return (
                <optgroup key={id} label={name}>
                  {spaces.map(space => (
                    <Option key={space.sys.id} value={space.sys.id}>
                      {space.name}
                    </Option>
                  ))}
                </optgroup>
              );
            })}
          </SelectField>
        )}
        {props.selectEnvironment === true && (
          <SelectField
            selectProps={{
              isDisabled: state.loading,
              testId: 'deeplink-select-environment'
            }}
            labelText="Environment"
            required
            id="environment"
            name="environment"
            value={state.environmentId}
            onChange={e => {
              selectEnvironment(e.target.value);
            }}>
            <Option value="">Select environment</Option>
            {state.environments.map(env => (
              <Option key={env.sys.id} value={env.sys.id}>
                {env.name}
              </Option>
            ))}
          </SelectField>
        )}
      </Form>
      <Button
        testId="deeplink-proceed"
        disabled={state.spaceId === '' || state.environmentId === ''}
        buttonType="positive"
        onClick={() => {
          props.onComplete({
            spaceId: state.spaceId,
            environmentId: state.environmentId
          });
        }}>
        Proceed
      </Button>
    </Card>
  );
}

DeeplinkSelectSpaceEnv.propTypes = {
  onComplete: PropTypes.func.isRequired,
  selectSpace: PropTypes.bool.isRequired,
  selectEnvironment: PropTypes.bool
};
