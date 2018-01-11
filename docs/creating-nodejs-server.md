# Creating NodeJS Server

1. Create EC2 Instance
1. SSH into it

- `ssh -i "CryptoMachineEC2.pem" ubuntu@ec2-18-218-99-112.us-east-2.compute.amazonaws.com`

1. Install NVM

- `curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash`
- `. ~/.nvm/nvm.sh`
- `nvm install 8.9.4`

1. Create a folder and start a npm project with `npm init`
1. `npm install express --save-dev`
1. Create a file `index.js` with a basic express app
1. Run `node index.js`

## Leave the server running when logout SSH session

- `node index.js`
- [Ctrl+Z] to pause the Node.js job
- `bg %1` => Run the job number in the background
- `jobs` => List background jobs

- `killall -9 node` => Stop all Node processes
- `exit` => Exit the SSH session

## Keeping the Node.js process running with PM2

- `npm i -g pm2` => Install PM2 globally
- `pm2 start tutorial/index.js` => Start your server, simply use `pm2` to execute `index.js`
- `pm2 startup` => Make sure that your PM2 restarts when your server restarts
- Run the code that the previous command outputs
- `pm2 save` => Save the current running processes so they are run when PM2 restarts
- `pm2 ls` => List all processes

### Stop the process, remove it and start it back up with a nicer name

- `pm2 stop index` => Stop the daemon
- `pm2 delete index` => Remove it from the list
- `pm2 start tutorial/index.js --name “Tutorial”` => Start it again, but with a better name

## Find and kill node processes

- `ps -ef | grep node`
- `pkill -f node`

## Serving HTTP traffic on the standard port, 80 with Nginx

- `sudo apt-get install nginx` => Then visit the public DNS URL into a browser
- `sudo /etc/init.d/nginx start` => If doesn't work, start it manually

### Configure nginx to route port 80 traffic to port 3000

- `cat /etc/nginx/sites-available/default` => Look to the default config as reference
- `sudo rm /etc/nginx/sites-enabled/default` => Delete the default config of `sites-enabled` folder but we will leave it in `sites-available`for reference.
- `sudo nano /etc/nginx/sites-available/tutorial` => Create a config file in `sites-available` and name it whatever you like.

*This will forward all HTTP traffic from port 80 to port 3000.*

```bash
server {
  listen 80;
  server_name tutorial;
  location / {
    proxy_set_header  X-Real-IP  $remote_addr;
    proxy_set_header  Host       $http_host;
    proxy_pass        http://127.0.0.1:3000;
  }
}
```

- `sudo ln -s /etc/nginx/sites-available/tutorial /etc/nginx/sites-enabled/tutorial` => Link the config file in sites enabled (this will make it seem like the file is actually copied in `sites-enabled`).
- `sudo service nginx restart` => Restart nginx for the new config to take effect.

## Deploying code into the server

- Create a GitHub repository with a basic Express app
- SSH into the server
- Generate a SSH private/public key pair and then add it as a deployment key in source control (i.e. Github)
  - *Only when the server is allowed access to the remote repo will it be able to clone the code and pull down changes.*
  - `ssh-keygen -t rsa` => When prompted, use the default name
  - `cat ~/.ssh/id_rsa.pub` => Show the contents of the file
  - Add the key as a Deploy Key in the GitHub repository
  - Edit `~/.bashrc` file to add the keys whenever logged in over SSH and run `source ~/.bashrc` to load the new config

```bash
# Start the SSH agent
eval `ssh-agent -s`
# Add the SSH key
ssh-add
```

## Config PM2 to deploy on the server

- `pm2 ls` => ensure that there are no process still running on PM2
- `pm2 delete tutorial` => if a task is still running, delete it
- Create a PM2 config file: `ecosystem.config.js`

```js
module.exports = {
  apps: [{
    name: 'tutorial-2',
    script: './index.js'
  }],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'ec2-52-209-166-225.eu-west-1.compute.amazonaws.com',
      key: '~/.ssh/tutorial-2.pem',
      ref: 'origin/master',
      repo: 'git@github.com:roberttod/tutorial-pt-2.git',
      path: '/home/ubuntu/tutorial-2',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
    }
  }
}
```

- `pm2 deploy ecosystem.config.js production setup` => Setup the directories on the remote
- Commit and push the PM2 config file
- Fix the code that excludes non-interactive sessions on `~/.bashrc`, moving *NVM code* above the *non-interactive code*
- `pm2 deploy ecosystem.config.js production` => Run the deploy command
- Add *restart* and *deploy* scripts to the `package.json`
- `npm i pm2 --save-dev` install PM2 locally
- Commit and push all changes
- `npm run-script deploy` => Deploy the app
- `pm2 save` => SSH into server and make sure the app restarts when the server restarts

## Serving HTML

- Remove the default route handler '/' and set up a static directory that express will use

```js
const express = require('express')
const app = express()

app.use(express.static('public'))
app.listen(3000, () => console.log('Server running on port 3000'))
```

- Create a `public/index.html` file
- Check the server locally `node index.js`
- Deploy the changes `npm run-script deploy`

## Resources

- https://hackernoon.com/tutorial-creating-and-managing-a-node-js-server-on-aws-part-1-d67367ac5171
- https://hackernoon.com/tutorial-creating-and-managing-a-node-js-server-on-aws-part-2-5fbdea95f8a1
- http://pm2.keymetrics.io/