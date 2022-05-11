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
**Install NVM**
```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

**Setup Node.js Version**
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

## Running Kubevious

