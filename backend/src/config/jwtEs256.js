import fs from 'node:fs';

const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;

const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

if (!privateKeyPath || !publicKeyPath) {
  throw new Error(
    'JWT_PRIVATE_KEY_PATH and JWT_PUBLIC_KEY_PATH must be configured'
  );
}

function readRequiredKey(path, label) {
  try {
    const value = fs.readFileSync(path, 'utf8').trim();

    if (!value) {
      throw new Error(`${label} is empty`);
    }

    return value;
  } catch (error) {
    const wrapped = new Error(
      `Unable to load ${label} from ${path}: ${error.message}`
    );
    wrapped.cause = error;
    throw wrapped;
  }
}

export const jwtAlgorithm = 'ES256';
export const jwtPrivateKey = readRequiredKey(
  privateKeyPath,
  'JWT private key'
);
export const jwtPublicKey = readRequiredKey(
  publicKeyPath,
  'JWT public key'
);
