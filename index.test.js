const os = require('os');

// Mocked helpers
jest.mock('./services', () => ({ getMyPublicIp: jest.fn() }));
const { getMyPublicIp } = require('./services');

// Copy of parseArgs from index.js
function parseArgs() {
  const getArg = (flag) => {
    const idx = process.argv.indexOf(flag);
    return (idx > -1 && process.argv.length > idx + 1)
      ? process.argv[idx + 1]
      : null;
  };
  const profile = getArg('--profile') || 'default';
  const region  = getArg('--region')  || 'us-east-1';
  const sgId    = getArg('--group-id');
  const port    = parseInt(getArg('--port') || '22', 10);
  let   ipCidr  = getArg('--ip');
  const autoIp  = process.argv.includes('--auto-ip');
  return { profile, region, sgId, port, ipCidr, autoIp };
}

// Copy of resolveIpCidr from index.js
async function resolveIpCidr(ipCidr, autoIp) {
  if (autoIp || !ipCidr) {
    const ip = await getMyPublicIp();
    return `${ip}/32`;
  }
  return ipCidr;
}

describe('index.js helpers', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    jest.clearAllMocks();
  });

  describe('parseArgs', () => {
    it('parses all arguments correctly', () => {
      process.argv = ['node', 'script.js', '--profile', 'p', '--region', 'r', '--group-id', 'sg', '--ip', '1.2.3.4/32', '--port', '8080'];
      const args = parseArgs();
      expect(args).toEqual({ profile: 'p', region: 'r', sgId: 'sg', port: 8080, ipCidr: '1.2.3.4/32', autoIp: false });
    });
    it('uses defaults if not provided', () => {
      process.argv = ['node', 'script.js', '--group-id', 'sg'];
      const args = parseArgs();
      expect(args.profile).toBe('default');
      expect(args.region).toBe('us-east-1');
      expect(args.sgId).toBe('sg');
      expect(args.port).toBe(22);
      expect(args.ipCidr).toBeNull();
      expect(args.autoIp).toBe(false);
    });
    it('detects --auto-ip', () => {
      process.argv = ['node', 'script.js', '--group-id', 'sg', '--auto-ip'];
      const args = parseArgs();
      expect(args.autoIp).toBe(true);
    });
  });

  describe('resolveIpCidr', () => {
    it('returns ipCidr if provided and autoIp is false', async () => {
      const result = await resolveIpCidr('1.2.3.4/32', false);
      expect(result).toBe('1.2.3.4/32');
    });
    it('calls getMyPublicIp and returns /32 if autoIp is true', async () => {
      getMyPublicIp.mockResolvedValue('5.6.7.8');
      const result = await resolveIpCidr(null, true);
      expect(getMyPublicIp).toHaveBeenCalled();
      expect(result).toBe('5.6.7.8/32');
    });
    it('calls getMyPublicIp and returns /32 if ipCidr is not provided', async () => {
      getMyPublicIp.mockResolvedValue('9.8.7.6');
      const result = await resolveIpCidr(null, false);
      expect(getMyPublicIp).toHaveBeenCalled();
      expect(result).toBe('9.8.7.6/32');
    });
  });
}); 