[![Codefresh build status](https://g.codefresh.io/api/badges/pipeline/kubevious/default%2Fkubevious-master?type=cf-1)](https://g.codefresh.io/public/accounts/kubevious/pipelines/5dfac9226e1ebecb0fd3775d)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**Kubevious** is an open source softwarer which provides a usable and highly graphical interface for Kubernetes. Kubevious renders all configurations relevant the the application in one place. That saves a lot of time from operators, eliminating the need for looking up configurations and digging within selectors and labels. Kubevious works with any Kubernetes distributions and can be used at any stage of the project.

Kubevious also provides hints to operations to avoid and identify configurational and operational errors.

# Why Kubevious?
Running applications on top of Kubernetes produces dosens of objects. It is hard to make sense of existing deployments. **Kubevious** is made to help operators to navigate  infrastructure and deployment configurations.

![Kubevious Intro](docs/screens/intro.png)

# Running Kubevious
Kubevious works with any Kubernetes distrubution and runs within the cluster. Deploy using Helm:

```sh
kubectl create namespace kubevious

git clone https://github.com/kubevious/deploy.git kubevious-deploy.git
cd kubevious-deploy.git/kubernetes

helm template kubevious \
    --namespace kubevious \
    > kubevious.yaml

kubectl apply -f kubevious.yaml
```

Wait for few seconds for deployment to succeed. Setup port forwarding:

```sh
kubectl port-forward $(kubectl get pod -l k8s-app=kubevious-ui -n kubevious -o jsonpath="{.items[0].metadata.name}") 3000:3000 -n kubevious
```

Access from browser: http://localhost:3000

For more details on installation options visit [Deployment Repository].

# Capabilities

## Visualizes Cluster In An Application Centric Way

![Visualizes Cluster In An Application Centric Way](https://github.com/kubevious/kubevious/raw/master/docs/screens/app-view.png)

Even a simple Hello World app in Kubernetes produces dosens of objects. It takes a lot of time to fetch application relevant configurations.

Kubeviuos renders entire Kubernets cluster configuration in an application centric graphical way. Kubevious identifies relevant Deployments, ReplicaSets, Pods, Services, Ingresses, Volumes, ConfigMaps, etc and renders withing the application boxes.

The main screen is rendered using boxes. Every box is expandable (using double-click) and selectable. The right side panel includes properties and configurations associated with each box. 


### Detects Configuration Errors

![Detects Configuration Errors](https://github.com/kubevious/kubevious/raw/master/docs/screens/config-errors.png)

Kubernetes follows detached notion for configuration. It super easy to have typos and errors when connecting components together.

Kubevious identifies many configuration errors, such as: misuse of labels, missing ports and others. A red circle with a number identifies number of errors withing the subtree.


### Identifies Blast Radius

![Identifies Blast Radius](https://github.com/kubevious/kubevious/raw/master/docs/screens/shared-configs.png)

Configuration in Kubernetes is highly reusable. A small change can cause unintended consequences. 

Kubevious identifies shared configurations and also displays other dependent objects. A single glance is enough to identify cascading effects of a particular change.


## Full Text Search

![Full Text Search](https://github.com/kubevious/kubevious/raw/master/docs/screens/full-text-search.png)

Looking for configration in Kubernetes haystack takes lots of time. 

Kubevious supports full text across across entire cluster.

# Authors
Everyone is welcome to contribute. See [CONTRIBUTING] for instructions on how to contribute.

# License
Kubevious is an open source project licensed under the [Apache License]. 

[Deployment Repository]: https://github.com/kubevious/deploy
[Apache License]: https://www.apache.org/licenses/LICENSE-2.0
[CONTRIBUTING]: CONTRIBUTING.md
