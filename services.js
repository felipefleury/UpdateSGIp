const https = require('https');

/**
 * Fetches the public IP address using the ipify API.
 * @returns {Promise<string>} Resolves with the public IP address as a string.
 */
function getMyPublicIp() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://api.ipify.org?format=json', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.ip);
        } catch (err) {
          reject(new Error('Failed to parse ipify response: ' + err.message));
        }
      });
    });
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Request to ipify timed out'));
    });
    req.on('error', err => reject(new Error('Failed to fetch public IP: ' + err.message)));
  });
}

module.exports = { getMyPublicIp };

