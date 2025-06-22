const { getMyPublicIp } = require('./services');
const https = require('https');

describe('getMyPublicIp', () => {
  let originalGet;

  beforeAll(() => {
    originalGet = https.get;
  });

  afterEach(() => {
    https.get = originalGet;
  });

  it('resolves with the correct IP on success', async () => {
    https.get = jest.fn((url, cb) => {
      const res = new (require('stream').Readable)();
      res._read = () => {};
      setImmediate(() => {
        cb(res);
        res.emit('data', JSON.stringify({ ip: '1.2.3.4' }));
        res.emit('end');
      });
      return { setTimeout: () => {}, on: () => {} };
    });
    await expect(getMyPublicIp()).resolves.toBe('1.2.3.4');
  });

  it('rejects if response is not valid JSON', async () => {
    https.get = jest.fn((url, cb) => {
      const res = new (require('stream').Readable)();
      res._read = () => {};
      setImmediate(() => {
        cb(res);
        res.emit('data', 'not json');
        res.emit('end');
      });
      return { setTimeout: () => {}, on: () => {} };
    });
    await expect(getMyPublicIp()).rejects.toThrow('Failed to parse ipify response');
  });

  it('rejects if https.get errors', async () => {
    https.get = jest.fn(() => {
      return {
        setTimeout: () => {},
        on: (event, handler) => {
          if (event === 'error') setImmediate(() => handler(new Error('fail')));
        }
      };
    });
    await expect(getMyPublicIp()).rejects.toThrow('Failed to fetch public IP: fail');
  });
}); 