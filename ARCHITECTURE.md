# Kubevious Architecture

Kubevious consists of 4 executable components. 

![Kubevious High-Level Architecture](https://github.com/kubevious/kubevious/blob/master/diagrams/high-level-architecture.png?raw=true)

**Backend** responds to user queries, fetches objects from database, handles search queries, updates rules, etc.

**Collector** is the brain of Kubevious. Collector executes correlation logic, applies validation logic, executes rules and persists changes to the database.

**Parser** is responsible for fetching resources from Kubernetes API Server and delivering them to Kubevious Collector. Parser can also perform transformation such as sanitizing K8s Secrets and other sensitive resources. Parser is the only component which communicates with the K8s API Server. It uses "watch" queries to extract resources. 

**Frontend** is the Web UI for Kubevious. Implemented with React. Hosted by Caddy server which routes requests to the Backend.

**MySQL** is used as a database to store rules configuration and Time Machine data.

**Redis** is used to implement search capability.

## Tech Stack
The stack is based on
- Node.js v14 + TypeScript
- Yarn
- React v17
- MySQL v8
- Redis v6 + RediSearch v2

## Where is the code? 

Kubevious is implemented using four executables and multiple shared modules. Clone following repos to get start with.

| Component   | Repo                                   |
| ----------- | -------------------------------------- |
| Backend     | https://github.com/kubevious/backend   |
| Collector   | https://github.com/kubevious/collector |
| Parser      | https://github.com/kubevious/parser    |
| Frontend    | https://github.com/kubevious/ui        |
| Helm Charts | https://github.com/kubevious/helm      |

The [full list of all artifacts](ARTIFACTS.md) for all repos and their build statuses.

## Local Setup and Development 
Refer to documentation to set up the [Development Environment](DEVELOPMENT.md).
