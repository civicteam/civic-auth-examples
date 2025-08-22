if (typeof global.document === 'undefined') {
  global.document = {
    createElement: () => ({}),
    createTextNode: () => ({}),
    getElementById: () => null,
    getElementsByTagName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
  } as any;
}