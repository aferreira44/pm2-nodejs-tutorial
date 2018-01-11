module.exports = {
  apps: [{
    name: 'pm2-nodejs-tutorial',
    script: './index.js'
  }],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'ec2-18-218-99-112.us-east-2.compute.amazonaws.com',
      key: '~/.ssh/CryptoMachineEC2.pem',
      ref: 'origin/master',
      repo: 'git@github.com:aferreira44/pm2-nodejs-tutorial.git',
      path: '/home/ubuntu/pm2-nodejs-tutorial',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
    }
  }
}