import * as TokenStore from 'services/TokenStore';
import {makeCtor as makeConstructor} from 'utils/TaggedValues';
import {makeReducer, createStore} from 'ui/Framework/Store';
import {render as renderTemplate} from './template';
import {assign} from 'utils/Collections';
import moment from 'moment';

const SelectType = makeConstructor('SelectType');
const SetGreeting = makeConstructor('SetGreeting');
const ChooseType = makeConstructor('ChooseType');

export function createCliEntryComponent (props) {
  const reducer = makeReducer({
    [SelectType] (state, type) {
      props.selectType(type);
      return assign(state, { type });
    },
    [SetGreeting] (state, greeting) {
      return assign(state, { greeting });
    },
    [ChooseType] (state) {
      props.chooseType(state.type);
      return state;
    }
  });

  const store = createStore({
    short: props.short,
    type: props.type,
    greeting: ''
  }, reducer);

  const actions = {
    selectType: SelectType,
    chooseType: ChooseType
  };

  const component = {
    actions,
    render: renderTemplate,
    store
  };

  TokenStore.user$.onValue(setUserGreeting);

  return {
    component,
    cleanup: () => {
      TokenStore.user$.offValue(setUserGreeting);
    }
  };

  function setUserGreeting (user) {
    const greeting = getGreeting(user);
    store.dispatch(SetGreeting, greeting);
  }
}

function getGreeting (user) {
  if (user) {
    const isNew = user.signInCount === 1;
    const name = user.firstName;

    if (isNew) {
      return 'Welcome, ' + name + '.';
    } else {
      return 'Good ' + getTimeOfDay() + ', ' + name + '.';
    }
  }
}

function getTimeOfDay () {
  const hour = moment().hour();
  if (hour < 12) {
    return 'morning';
  } else if (hour < 17) {
    return 'afternoon';
  } else {
    return 'evening';
  }
}
