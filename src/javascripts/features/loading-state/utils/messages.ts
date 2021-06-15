import { fromArray } from 'utils/Random';

const messages: string[] = [
  'Good things take time',
  'Take a moment to relax',
  'Building your page',
  'Gathering wild content types',
  'Adding some finishing touches',
  'Piecing together your page',
  'What’s for dinner?',
  'What fruit is in season?',
  'What’s the weather like?',
  'Unleashing the hounds',
  'Untangling spaghetti',
  'Reticulating splines',
  'Adding a pinch of salt',
  'When did you last see the sunset?',
  'Putting a cherry on top',
  'Catching the shooting stars',
  'Doing some heavy lifting',
  'Painting the last coat',
  'Warming up the engine',
  'When did you last drank water?',
  'Watering the plants',
  'Combing the lamas',
  'Straightening the bananas',
  'Filling your page',
  'Creating your page',
  'Loading…',
  'Loading your page',
  '…',
];

export const getRandomMessage = (): string => fromArray(messages);
