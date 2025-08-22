if (typeof global.window === 'undefined') {
  global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    location: {
      href: '',
      origin: '',
      protocol: 'https:',
      host: '',
      hostname: '',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
    },
    navigator: {
      userAgent: 'React Native',
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
  } as any;
}