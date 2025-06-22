const { getEc2Client, updateSecurityGroup, listSecurityGroupRules, revokeRuleByDescription } = require('./aws');
const { EC2Client, AuthorizeSecurityGroupIngressCommand, DescribeSecurityGroupsCommand, RevokeSecurityGroupIngressCommand } = require('@aws-sdk/client-ec2');
const { fromIni } = require('@aws-sdk/credential-providers');

jest.mock('@aws-sdk/client-ec2');
jest.mock('@aws-sdk/credential-providers');

describe('aws.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEc2Client', () => {
    it('returns an EC2Client instance with correct params', () => {
      fromIni.mockReturnValue('creds');
      getEc2Client('myprofile', 'us-west-2');
      expect(EC2Client).toHaveBeenCalledWith({ region: 'us-west-2', credentials: 'creds' });
    });
  });

  describe('updateSecurityGroup', () => {
    it('sends AuthorizeSecurityGroupIngressCommand', async () => {
      const send = jest.fn().mockResolvedValue('ok');
      const ec2 = { send };
      const params = { foo: 'bar' };
      AuthorizeSecurityGroupIngressCommand.mockImplementation((p) => ({ ...p, _cmd: true }));
      const result = await updateSecurityGroup(ec2, params);
      expect(send).toHaveBeenCalledWith(expect.objectContaining({ foo: 'bar', _cmd: true }));
      expect(result).toBe('ok');
    });
  });

  describe('listSecurityGroupRules', () => {
    it('returns the first security group if found', async () => {
      const send = jest.fn().mockResolvedValue({ SecurityGroups: [{ id: 1 }] });
      const ec2 = { send };
      DescribeSecurityGroupsCommand.mockImplementation((p) => p);
      const result = await listSecurityGroupRules(ec2, 'sg-123');
      expect(result).toEqual({ id: 1 });
    });
    it('returns null if no security group found', async () => {
      const send = jest.fn().mockResolvedValue({ SecurityGroups: [] });
      const ec2 = { send };
      const result = await listSecurityGroupRules(ec2, 'sg-123');
      expect(result).toBeNull();
    });
  });

  describe('revokeRuleByDescription', () => {
    it('removes rules with matching description', async () => {
      const send = jest.fn().mockResolvedValue('removed');
      const ec2 = { send };
      const sg = {
        IpPermissions: [
          { IpRanges: [{ Description: 'desc1' }], perm: 1 },
          { IpRanges: [{ Description: 'desc2' }], perm: 2 }
        ]
      };
      // Mock listSecurityGroupRules to return our SG
      const listSecurityGroupRules = jest.spyOn(require('./aws'), 'listSecurityGroupRules').mockResolvedValue(sg);
      RevokeSecurityGroupIngressCommand.mockImplementation((p) => p);
      await revokeRuleByDescription(ec2, 'sg-123', 'desc1');
      expect(send).toHaveBeenCalled();
      listSecurityGroupRules.mockRestore();
    });
    it('handles errors from send', async () => {
      const send = jest.fn().mockRejectedValue(new Error('fail'));
      const ec2 = { send };
      const sg = {
        IpPermissions: [
          { IpRanges: [{ Description: 'desc1' }], perm: 1 }
        ]
      };
      const listSecurityGroupRules = jest.spyOn(require('./aws'), 'listSecurityGroupRules').mockResolvedValue(sg);
      await expect(revokeRuleByDescription(ec2, 'sg-123', 'desc1')).rejects.toThrow('fail');
      listSecurityGroupRules.mockRestore();
    });
  });
});
