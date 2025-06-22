/**
 * Reads a command line argument in the form of "--flag value".
 * @param {string} flag - The flag to search for (e.g., '--profile').
 * @returns {string|null} The value after the flag, or null if not found.
 */
function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return (idx > -1 && process.argv.length > idx + 1) 
    ? process.argv[idx + 1] 
    : null;
}


module.exports = { getArg }