const { getArg } = require('./utils');

describe('getArg', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('returns the value after the flag if present', () => {
    process.argv = ['node', 'script.js', '--profile', 'testProfile'];
    expect(getArg('--profile')).toBe('testProfile');
  });

  it('returns null if the flag is not present', () => {
    process.argv = ['node', 'script.js', '--region', 'us-east-1'];
    expect(getArg('--profile')).toBeNull();
  });

  it('returns null if the flag is at the end with no value', () => {
    process.argv = ['node', 'script.js', '--profile'];
    expect(getArg('--profile')).toBeNull();
  });

  it('returns the value for the first occurrence if multiple flags', () => {
    process.argv = ['node', 'script.js', '--profile', 'one', '--profile', 'two'];
    expect(getArg('--profile')).toBe('one');
  });
}); 