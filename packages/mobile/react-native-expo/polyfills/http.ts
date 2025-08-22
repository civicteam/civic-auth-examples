// HTTP polyfill stub for React Native
// jose uses this for JWKS fetching, but in React Native we use fetch instead

export const request = () => {
  throw new Error('HTTP requests should use fetch() in React Native');
};

export const get = () => {
  throw new Error('HTTP requests should use fetch() in React Native');
};

export const Agent = class Agent {
  constructor() {}
};

export default {
  request,
  get,
  Agent,
};