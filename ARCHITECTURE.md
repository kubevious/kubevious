## Kubevious Archictecture

Kubevious consists of 3 executable components. 

![Kubevious High-Level Architecture](https://github.com/kubevious/kubevious/blob/master/diagrams/high-level-architecture.png?raw=true)

**Backend** is the brain of Kubevious. Backend executes correlation logic, applies validation logic, executes rules and persists changes to the database. Backend also responds to user request and handles search queries.

**Parser** is responsible for fetching resources from Kubernetes API Server and delivering them to Kubevious Backend. Parser can also perform transformation such as sanitizing K8s Secrets and other sensitive resources. Parser is the only component which communicates with the K8s API Server. It uses "watch" queries to extract resources. 

**Frontend** is the web UI for Kubevious. Frontend communicates with the Backend.

**MySQL** is used as a database to store rules configuration and Time Machine data.

## Tech Stack
The stack is based on
- Node.js v14 + TypeScript
- NPM (transitioning to Yarn)
- React v16
- MySQL v8

## Repositories 

| Component   | Repo                                 |
| ----------- | ------------------------------------ |
| Backend     | https://github.com/kubevious/backend |
| Parser      | https://github.com/kubevious/parser  |
| Frontend    | https://github.com/kubevious/ui      |
| Helm Charts | https://github.com/kubevious/helm    |

## Local Setup and Development 
Refer to readmes for Backend, Parser and Frontend repos for instructions. 