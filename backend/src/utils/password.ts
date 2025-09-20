import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hashRefreshToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, SALT_ROUNDS);
};

export const compareRefreshToken = async (token: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(token, hash);
};
