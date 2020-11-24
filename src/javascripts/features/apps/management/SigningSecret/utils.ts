import RandExp from 'randexp';

// generate a random 64-length string from a RegExp
const randomStringRegExp = new RandExp(/[A-Za-z0-9-_]{64}/);

// improve randomness as randexp uses Math.random
const crypto = window.crypto;
if (crypto?.getRandomValues) {
  randomStringRegExp.randInt = (from, to) => {
    const randomBuffer = new Uint32Array(1);
    const range = to - from + 1; // inclusive range per https://github.com/fent/randexp.js#custom-prng
    crypto.getRandomValues(randomBuffer);
    const randomZeroToOne = randomBuffer[0] / 0xffffffff;
    return Math.floor(randomZeroToOne * range + from);
  };
}

export const generateSecret = (): string => randomStringRegExp.gen();
