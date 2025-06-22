#!/usr/bin/env node

/**
 * Script to update an AWS Security Group to allow access from a specific IP and port.
 * Usage: node update-sg.js --profile <aws-profile> --region <aws-region> --group-id <sg-id> [--ip <cidr> | --auto-ip] [--port <port>]
 */

const { updateSecurityGroup, listSecurityGroupRules, revokeRuleByDescription, getEc2Client } = require("./aws");
const { getMyPublicIp } = require("./services");
const { getArg } = require("./utils");
const os = require('os');

/**
 * Parses and validates command line arguments.
 * @returns {object} Parsed arguments.
 */
function parseArgs() {
  const profile = getArg('--profile') || 'default';
  const region  = getArg('--region')  || 'us-east-1';
  const sgId    = getArg('--group-id');
  const port    = parseInt(getArg('--port') || '22', 10);
  let   ipCidr  = getArg('--ip');
  const autoIp  = process.argv.includes('--auto-ip');

  if (!sgId) {
    console.error(`\nUsage:
  node update-sg.js \\
    --profile <aws-profile> \\
    --region <aws-region> \\
    --group-id <sg-id> \\
    [--ip <cidr> | --auto-ip] [--port <port>]

Options:
  --ip       Fixed IP/CIDR (e.g., 143.0.113.5/32)
  --auto-ip  Fetches public IP from ipify and applies /32
  --port     TCP port (default 22)

Example:
  node update-sg.js --profile myservice --region us-east-1 \\
    --group-id sg-0abc12344def5678gh --auto-ip --port 8000
`);
    process.exit(1);
  }
  return { profile, region, sgId, port, ipCidr, autoIp };
}

/**
 * Gets the public IP in CIDR format, either from argument or by fetching.
 * @param {string|null} ipCidr - The IP/CIDR argument.
 * @param {boolean} autoIp - Whether to fetch the public IP automatically.
 * @returns {Promise<string>} The IP in CIDR format.
 */
async function resolveIpCidr(ipCidr, autoIp) {
  if (autoIp || !ipCidr) {
    try {
      console.log('Fetching public IP from ipify...');
      const ip = await getMyPublicIp();
      const cidr = `${ip}/32`;
      console.log('Detected public IP:', cidr);
      return cidr;
    } catch (err) {
      console.error('Failed to fetch public IP:', err.message);
      process.exit(2);
    }
  }
  return ipCidr;
}

/**
 * Main execution function.
 */
async function main() {
  const { profile, region, sgId, port, ipCidr, autoIp } = parseArgs();
  const resolvedIpCidr = await resolveIpCidr(ipCidr, autoIp);
  const ec2 = getEc2Client(profile, region);
  const hostname = os.hostname();
  const params = {
    GroupId: sgId,
    IpPermissions: [
      {
        IpProtocol: 'tcp',
        FromPort: port,
        ToPort: port,
        IpRanges: [{ CidrIp: resolvedIpCidr, Description: hostname }]
      }
    ]
  };
  try {
    console.log(`Adding rule: ${resolvedIpCidr} port ${port} to SG ${sgId}...`);
    await revokeRuleByDescription(ec2, sgId, hostname, resolvedIpCidr);
    const resp = await updateSecurityGroup(ec2, params);
    console.log('Rule successfully added:', JSON.stringify(resp, null, 2));
  } catch (err) {
    console.error('Failed to update the Security Group:', err.message || err);
    process.exitCode = 3;
  }
}

main();
