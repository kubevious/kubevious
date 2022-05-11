# Development Instructions
Kubevious consists of 4 executables and multiple shared modules spread across separate repositories. See the list of all [Artifacts here](ARTIFACTS.md). Learn about [Kubevious Architecture here](ARCHITECTURE.md).

## Tech Stack
The stack is based on
- Node.js v14 + TypeScript
- Yarn
- React v17
- MySQL v8
- Redis v6 + RediSearch v2

## Cloning Repositories
```sh
mkdir kubevious-oss
cd kubevious-oss
git clone https://github.com/kubevious/workspace workspace.git
workspace.git/kubevious-oss-workspace-init.sh
```

## Install Global Tools

**Install Node.js v14**
Install NVM
```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

Install and activate Node.js v14
```sh
nvm install 14
nvm alias default 14
nvm use default
node -v
```

**Install YARN**
```sh
npm install -g yarn
```

**Install NPM-CHECK-UPDATES**
```sh
npm install -g npm-check-updates
```
**Install Caddy Web Server**
Follow instructions: https://caddyserver.com/docs/install

## Running Kubevious

**Run Dependencies**

It runs Mysql, Redis and Caddy Web Server
```sh
dependencies.git/run-dependencies.sh
```

**Collector**
```sh
collector.git/initialize.sh
collector.git/run-dev.sh
```

**Backend**
```sh
backend.git/initialize.sh
backend.git/run-dev.sh
```

**UI**
```sh
ui.git/initialize.sh
ui.git/run-dev.sh
```

**Parser**
```sh
parser.git/initialize.sh
parser.git/run-dev-mock.sh
```