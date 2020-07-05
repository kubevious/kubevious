<!-- [![Gitter](https://badges.gitter.im/kubevious/community.svg)](https://gitter.im/kubevious/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) -->
[![Slack](https://img.shields.io/badge/chat-on%20slack-ff69b4)](https://kubevious.io/slack)
[![Codefresh build status](https://g.codefresh.io/api/badges/pipeline/kubevious/Image%20Builds%2Fkubevious-master?type=cf-1)](https://g.codefresh.io/public/accounts/kubevious/pipelines/new/5dfac9226e1ebecb0fd3775d)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
<a href="https://www.f6s.com/kubevious?follow=1" target="_blank" title="Follow Kubevious on F6S"><img src="https://www.f6s.com/images/f6s-follow-green.png" border="0" width="78" height="22 " alt="Follow Kubevious on F6S" style="width: 78px; height: 22px; padding: 0px; margin: 0px;" /></a>

* [What is Kubevious?](#what-is-kubevious)
* [Intro Video](#intro-video)
* [Live Demo](#live-demo)
* [Running Kubevious](#running-kubevious)
* [Capabilities](#capabilities)

# What is Kubevious?
**Kubevious** (pronounced [kju:bvi:əs]) is open-source software that provides a usable and highly graphical interface for Kubernetes. Kubevious renders all configurations relevant to the application in one place. That saves a lot of time from operators, eliminating the need for looking up settings and digging within selectors and labels. Kubevious works with any Kubernetes distributions. Kubevious and can be used at any stage of the project.

Kubevious also provides hints to operators to avoid and identify configurational and operational errors.

# Intro Video
<!-- ![Kubevious Intro Video](https://github.com/kubevious/media/raw/master/videos/intro.gif) -->
<a href="https://youtu.be/YVBjt-9ugTg" target="_blank">
<img src="https://github.com/kubevious/media/raw/master/videos/intro.gif" />
</a>

See the collection of other demo videos: https://www.youtube.com/channel/UCTjfcEFrGjqtSGtry4ySUzQ

# Live Demo
See our live demo running on a model cluster: [https://demo.kubevious.io](https://demo.kubevious.io).

# Running Kubevious
Kubevious works with any Kubernetes distribution and runs within the cluster. Deploy using Helm v3:

```sh
kubectl create namespace kubevious

helm repo add kubevious https://helm.kubevious.io

helm upgrade --atomic -i kubevious kubevious/kubevious --version 0.6.35 -n kubevious 

kubectl port-forward $(kubectl get pod -l k8s-app=kubevious-ui -n kubevious -o jsonpath="{.items[0].metadata.name}") 3000:80 -n kubevious
```
Access from browser: http://localhost:3000

For more details on installation options visit [Deployment Repository].

# Capabilities

* [Cluster and Configs in an Application Centric View](#cluster-and-configs-in-an-application-centric-view)
* [Detects Configuration Errors](#detect-configuration-errors)
* [Write Your Own Validation Rules](#write-your-own-validation-rules)
* [Identifies Blast Radius](#identify-blast-radius)
* [Full Text Search](#full-text-search)
* [Perform Capacity Planning and Optimize Resource Usage](#perform-capacity-planning-and-optimize-resource-usage)
* [Time Machine](#time-machine)
* [Radioactive & Overprivileged Workloads](#radioactive--overprivileged-workloads)
* [Correlated RBAC](#correlated-rbac)


## Cluster and Configs in an Application Centric View

![Cluster and Configs in an Application Centric View](https://github.com/kubevious/media/raw/master/screens/app-view.png)

Even a simple Hello World app in Kubernetes produces dozens of objects. It takes a lot of time to fetch application relevant configurations.

Kubeviuos renders the entire Kubernetes cluster configuration in an application-centric graphical way. Kubevious identifies relevant Deployments, ReplicaSets, Pods, Services, Ingresses, Volumes, ConfigMaps, etc. and renders withing the application boxes.

The main screen is rendered using boxes. Every box is expandable (using double-click) and selectable. The right side panel includes properties and configurations associated with each box. 


## Detect Configuration Errors

![Detect Configuration Errors](https://github.com/kubevious/media/raw/master/screens/config-errors.png)

Kubernetes follows a detached notion for configuration. It is super easy to have typos and errors when connecting components.

Kubevious identifies many configuration errors, such as misuse of labels, missing ports, and others. The red circle contains the number of errors within the subtree.

## Write Your Own Validation Rules 

![Kubevious Rule Editor Rule Script](https://github.com/kubevious/media/raw/master/screens/rules-engine/rule-editor-rule-script.png)

Kubevious comes with an ability to support organizations needing additional rules beyond the built-in checks (such as label mismatch, missing port, misused or overused objects, etc.). It does that by allowing Kubernetes operators to define their own rules, and allowing organizations to enforce DevOps best practices without changing their existing release processes. The rules in Kubevious are continuously assured to be compliant to company policies and security postulates to be enforced. Rules are defined using a domain-specific JavaScript syntax to allow custom rules to be easily written and understood. 

Learn more about defining your own rules [here](https://github.com/kubevious/kubevious/blob/master/docs/rules-engine.md#rules-engine).

![Kubevious Rule Editor Affected Objects](https://github.com/kubevious/media/raw/master/screens/rules-engine/rule-editor-affected-errors.png)

## Identify Blast Radius

![Identify Blast Radius](https://github.com/kubevious/media/raw/master/screens/shared-configs.png)

Configuration in Kubernetes is highly reusable. A small change can cause unintended consequences. 

Kubevious identifies shared configurations and also displays other dependent objects. A single glance is enough to identify the cascading effects of a particular change.


## Full Text Search

![Full Text Search](https://github.com/kubevious/media/raw/master/screens/full-text-search.png)

Looking for a particular configuration in Kubernetes haystack takes lots of time. 

Kubevious supports full text across across entire cluster.

## Perform Capacity Planning and Optimize Resource Usage
![Perform Capacity Planning and Optimize Resource Usage](https://github.com/kubevious/media/raw/master/screens/capacity-planning.png)

Clearly identify how much resources are taken by each container, pod, deployment, daemonset, namespace, etc. 

Kubevious renders not only absolute resource request values, but also relative usage per node, namespace and entire cluster. Identify which apps take most resources within the namespace.

## Time Machine
![Time Machine](https://github.com/kubevious/media/raw/master/screens/time-machine-1.png)

With ever changing configuration it is hard to keep track and identify the source of the problem. 

Kubvious allows you to travel back in time and navigate configuration as well as errors. See time machine in action here: https://youtu.be/Zb5ZIJEHONU

## Radioactive & Overprivileged Workloads
![Radioactive & Overprivileged Workloads](https://github.com/kubevious/media/raw/master/screens/radioactive-1.png)

Granting excessive control to workloads not only increases the risk of being hacked but also affects the stability of nodes and the entire cluster.

Kubevious marks workloads and their corresponding namespaces as radioactive. Specifically, it checks for privileged containers, hostPID, hostNetwork, hostIPC flags, and mounts to sensitive host locations like docker.sock file, etc.  

## Correlated RBAC
![RBAC Multiple ClusterRoles](https://github.com/kubevious/media/raw/master/screens/rbac-1.png)

Things get messy when it comes to Kubernetes RBAC. There are too many indirections and links to navigate to identify permissions applied to pods.

Kubevious provides correlated view across Roles, Bindings, ServiceAccounts and Applications. Kubevious goes one step further and combines permissions across all relevant roles and presents them in a single role matrix. 

![RBAC Shared ServiceAccount](https://github.com/kubevious/media/raw/master/screens/rbac-2.png)

Just like in case of ConfigMaps, the ServiceAccounts, Roles and Bindings can be marked with "Shared-By" flag. That would mean that the ServiceAccount, Role or Binding is used elsewhere, and any changes to would affect other applications as well. 

# Authors
Everyone is welcome to contribute. See [CONTRIBUTING] for instructions on how to contribute.

# License
Kubevious is an open source project licensed under the [Apache License]. 

[Deployment Repository]: https://github.com/kubevious/helm
[Apache License]: https://www.apache.org/licenses/LICENSE-2.0
[CONTRIBUTING]: CONTRIBUTING.md

