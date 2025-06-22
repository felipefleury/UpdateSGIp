const { EC2Client, AuthorizeSecurityGroupIngressCommand, DescribeSecurityGroupsCommand, RevokeSecurityGroupIngressCommand } = require('@aws-sdk/client-ec2');
const { fromIni } = require('@aws-sdk/credential-providers');

/**
 * Creates an authenticated EC2 client.
 * @param {string} profile - AWS profile name.
 * @param {string} region - AWS region.
 * @returns {EC2Client}
 */
const getEc2Client = (profile, region) => {
    return new EC2Client({
        region,
        credentials: fromIni({ profile })
    });
}

/**
 * Authorizes a new ingress rule in a Security Group.
 * @param {EC2Client} ec2 - The EC2 client instance.
 * @param {object} params - Parameters for the ingress rule.
 * @returns {Promise<object>} - AWS response.
 */
const updateSecurityGroup = async (ec2, params) => {
    try {
        const cmd = new AuthorizeSecurityGroupIngressCommand(params);
        return await ec2.send(cmd);
    } catch (err) {
        console.error('Failed to update security group:', err.message || err);
        throw err;
    }
}

/**
 * Finds permissions in a list that match a given description.
 * @param {Array} permissions - List of permissions.
 * @param {string} description - Description to match.
 * @returns {Array} - Matching permissions.
 */
const findPermissionsByDescription = (permissions, description) => {
    const ret = [];
    permissions.forEach(perm => {
        perm.IpRanges.forEach(ipRange => {
            if (ipRange.Description === description) {
                ret.push(perm);
            }
        });
    });
    return ret;
}

/**
 * Revokes ingress rules from a Security Group by description.
 * @param {EC2Client} ec2 - The EC2 client instance.
 * @param {string} sgId - Security Group ID.
 * @param {string} description - Description to match.
 * @param {string} ip - IP address (currently unused, for future use).
 * @returns {Promise<void>}
 */
const revokeRuleByDescription = async (ec2, sgId, description, ip) => {
    console.log(`Searching for a rule with description "${description}"...`);
    const sg = await listSecurityGroupRules(ec2, sgId);
    if (!sg) return; // If SG not found, stop.
    const ipPermissionsToRemove = findPermissionsByDescription(sg.IpPermissions, description);
    if (ipPermissionsToRemove.length === 0) {
        console.log('No rule with that description found.');
        return;
    }

    // Build parameters for RevokeSecurityGroupIngressCommand
    const params = {
        GroupId: sgId,
        IpPermissions: ipPermissionsToRemove,
    };

    try {
        const cmd = new RevokeSecurityGroupIngressCommand(params);
        const resp = await ec2.send(cmd);
        console.log('Rules successfully removed:', JSON.stringify(resp, null, 2));
    } catch (err) {
        console.error('Error removing rules:', err.message || err);
        throw err;
    }
}

/**
 * Lists the rules of a Security Group.
 * @param {EC2Client} ec2 - The EC2 client instance.
 * @param {string} sgId - Security Group ID.
 * @returns {Promise<object|null>} - Security Group object or null if not found.
 */
const listSecurityGroupRules = async (ec2, sgId) => {
    try {
        const cmd = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
        const resp = await ec2.send(cmd);
        if (!resp.SecurityGroups || resp.SecurityGroups.length === 0) {
            console.warn(`Security Group ${sgId} not found.`);
            return null;
        }
        return resp.SecurityGroups[0];
    } catch (err) {
        console.error('Error listing security group rules:', err.message || err);
        throw err;
    }
}

module.exports = { updateSecurityGroup, listSecurityGroupRules, revokeRuleByDescription, getEc2Client }


