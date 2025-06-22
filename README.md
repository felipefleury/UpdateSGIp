# UpdateSGIp

A CLI tool to easily authorize your current (or specified) IP address in an AWS Security Group for a given port. Useful for developers and DevOps who need to quickly allow access to cloud resources.

---

## Prerequisites

- **Node.js** (v14 or higher recommended)
- **AWS credentials** configured (via `~/.aws/credentials` or environment variables)
- AWS IAM user/role with permissions to modify Security Groups (`ec2:AuthorizeSecurityGroupIngress`, `ec2:RevokeSecurityGroupIngress`, `ec2:DescribeSecurityGroups`)

---

## Installation

```sh
npm i update-ip-sg -g
```

---

## Usage

Run the script:

```sh
update-sg-ip \
  --profile <aws-profile> \
  --region <aws-region> \
  --group-id <sg-id> \
  [--ip <cidr> | --auto-ip] [--port <port>]
```

### Arguments

- `--profile`   : (Optional) AWS CLI profile to use. Default: `default`
- `--region`    : (Optional) AWS region. Default: `us-east-1`
- `--group-id`  : (Required) The Security Group ID to update (e.g., `sg-0abc1234def5678gh`)
- `--ip`        : (Optional) IP/CIDR to allow (e.g., `203.0.113.5/32`)
- `--auto-ip`   : (Optional) Automatically detect your public IP and use `/32` CIDR
- `--port`      : (Optional) TCP port to allow. Default: `22`

> **Note:** Either `--ip` or `--auto-ip` must be provided. If both are omitted, `--auto-ip` is assumed.

---

## Example

Allow your current public IP to access port 1433 on a specific Security Group:

```sh
update-sg-ip --profile myservice --region us-east-1 \
  --group-id sg-0abc1234def5678gh --auto-ip --port 1433
```

Allow a specific IP/CIDR to access port 22:

```sh
update-sg-ip --group-id sg-0abc1234def5678gh --ip 203.0.113.5/32 --port 22
```

---

## Security Notes

- This tool will **remove any previous rule** for the same hostname/description before adding the new rule.
- Make sure your AWS credentials are protected and have the minimum required permissions.
- Use with caution in production environments.

---

## License

MIT License