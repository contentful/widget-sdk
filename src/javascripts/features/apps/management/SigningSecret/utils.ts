import RandExp from 'randexp';

// generate a random 64-length string from a RegExp
const randomStringRegExp = new RandExp(/[A-Za-z0-9-_]{64}/);

// improve randomness as randexp uses Math.random
const crypto = window.crypto;
if (crypto?.getRandomValues) {
  randomStringRegExp.randInt = (from, to) => {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const randomZeroToOne = randomBuffer[0] / (0xffffffff + 1);
    return randomZeroToOne * (to - from) + from;
  };
}

export const generateSecret = (): string => randomStringRegExp.gen();
