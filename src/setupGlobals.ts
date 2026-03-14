// Ensure Node-style globals exist for libraries that expect them (e.g. sockjs-client)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (window as any).global === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).global = window;
}

