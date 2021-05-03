import { fromArray } from 'utils/Random';

const messages: string[] = [
  'Good things take time',
  'Take a moment to relax',
  'Building your page',
  'Gathering wild content types',
  'Waiting is the wurst!',
  'Adding some finishing touches',
  'Piecing together your page',
  'Proofreading your page',
  'Cooking up your content',
  'Remember to water your plants',
  'Filling your page with content',
  'What’s for dinner?',
  'What fruit is in season?',
  'What’s the weather like?',
];

export const getRandomMessage = (): string => fromArray(messages);
