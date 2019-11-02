const { execSync } = require('child_process');

module.exports = async () =>  {
    execSync(`kill -2 ${slsPid}`);

    console.log("Serverless Offline stopped");
    return null;
};
