<!-- [![Gitter](https://badges.gitter.im/kubevious/community.svg)](https://gitter.im/kubevious/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) -->
[![Slack](https://img.shields.io/badge/chat-on%20slack-ff69b4)](https://kubevious.io/slack)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
<a href="https://www.f6s.com/kubevious?follow=1" target="_blank" title="Follow Kubevious on F6S"><img src="https://www.f6s.com/images/f6s-follow-green.png" border="0" width="78" height="22 " alt="Follow Kubevious on F6S" style="width: 78px; height: 22px; padding: 0px; margin: 0px;" /></a>


# What is Kubevious?
**Kubevious** (pronounced [kju:bvi:əs]) helps running modern Kubernetes applications without disasters. Kubevious continuously validates application manifests and cluster states for misconfigurations, conflicts, typos, and violations of cloud-native best practices. Kubevious provides unique app-centric insights to introspect and troubleshoot applications right out of the box when issues arise. Kubevious operates inside the cluster and is accessible as a web app. It only takes a couple of minutes to get Kubevious up and running for existing production applications.

- [Intro Video](#intro-video)
- [Live Demo](#live-demo)
- [Running Kubevious](#running-kubevious)
- [What can you do with Kubevious?](#what-can-you-do-with-kubevious)
- [Contributing](#contributing)
- [Governance](#governance)
- [Roadmap](#roadmap)
- [License](#license)
- [Community Posts, Reviews and Videos](#community-posts-reviews-and-videos)


# Intro Video
<!-- ![Kubevious Intro Video](https://github.com/kubevious/media/raw/master/videos/intro.gif) -->
<a href="https://youtu.be/YVBjt-9ugTg" target="_blank">
<img src="https://github.com/kubevious/media/raw/master/videos/intro.gif" />
</a>

_This is a recording of the older version. We'll get the new one recorded soon!_

See the collection of other demo videos: https://www.youtube.com/channel/UCTjfcEFrGjqtSGtry4ySUzQ

# Live Demo
See our live demo running on a model cluster: [https://demo.kubevious.io](https://demo.kubevious.io).

# Running Kubevious
Kubevious works with any Kubernetes distribution and runs within the cluster. Deploy using Helm v3.2+:

```sh
kubectl create namespace kubevious

helm repo add kubevious https://helm.kubevious.io

helm upgrade --atomic -i kubevious kubevious/kubevious --version 0.9.18 -n kubevious

kubectl port-forward $(kubectl get pods -n kubevious -l "app.kubernetes.io/component=kubevious-ui" -o jsonpath="{.items[0].metadata.name}") 8080:80 -n kubevious 
```
Access from browser: http://localhost:8080

For more details on installation options visit [Deployment Repository](https://github.com/kubevious/helm).

## Running Kubevious Outside the Cluster
While **Kubevious** was made to run inside the cluster and monitor the cluster it lives in, **[Kubevious Portable](https://github.com/kubevious/portable)** version runs outside the cluster. Usually, that would happen on development machines from where operators would run *kubectl* commands. Kubevious Portable runs inside a single docker container. Kubevious Portable does not have Rule Executing and Time Machine capabilities and is meant for quick sanity check and visualization of Kubernetes clusters and applications. Kubevious Portable connects to clusters defined in kube-config files. See instructions on [running Kubevious Portable here](https://github.com/kubevious/portable#running-kubevious-portable).

# What can you do with Kubevious?
## Observe
Kubevious processes Kubernetes cluster configuration and state into several domain focused views. Learn more about Kubevious UI [here](https://kubevious.io/docs/features/application-centric-ui/).

- **Logic View** is focused on app-centricity, where container, compute, networking, storage, and RBAC related manifests correlated and grouped under Application nodes.
- **Image View** is focused on container images and container image repositories used in the cluster.
- **Gateway View** provides visibility regarding how applications are exposed to the public using Ingresses and API Gateways.
- **RBAC View** identifies how Users and Groups are used in the cluster.
- **Package View** provides visibility to Helm charts installed in the Kubernetes cluster.

![Cluster and Configs in an Application Centric View](https://kubevious.io/static/b4e981857c1b19c3d5b6c452ff17eadb/3f20e/main-ui-hints.png)

## Analyze
Kubevious provides correlated insights to the following areas:

- [Correlated Network Policies](https://kubevious.io/docs/features/cloud-native-tools/correlated-network-policies/)
- [Correlated RBAC](https://kubevious.io/docs/features/cloud-native-tools/correlated-rbac/)
- [Identifying Blast Radius](https://kubevious.io/docs/features/cloud-native-tools/identifying-blast-radius/)
- [Radioactive Workloads](https://kubevious.io/docs/features/cloud-native-tools/radioactive-workloads/)
- [Capacity Planning and Resource Usage Optimization](https://kubevious.io/docs/features/cloud-native-tools/capacity-planning-and-resource-usage-optimization/)

## Validate
Kubevious continuously validates cluster configuration and state for misconfigurations, typos and violations to best practices. 

- [Built-in Validations](https://kubevious.io/docs/built-in-validators/) include 32-rules that validates configution across multiple manifests.
- [Rules Engine](https://kubevious.io/docs/features/rules-engine/) allows extension of validation logic using a JavaScript like if-then-else syntax.

## Investigate
- [Time Machine](https://kubevious.io/docs/features/time-machine/) lets you travel back in time and see why did the application break, at which point of time and extract working manifests to recover. Time Machine also keeps track of changes that are intrinsically happening by k8s operators.
![Kubevious Search Engine](https://kubevious.io/static/452c7f6c9960b3dedfd41baea7567ee6/3f20e/time-machine-active.png)
- [Search Engine](https://kubevious.io/docs/features/search-engine/) implements a “Google” like a full-text search engine to find and return Kubernetes manifests matching various search criteria.
![Kubevious Search Engine](https://kubevious.io/static/d2f0c37d574441032aa8dfb57332d17f/3f20e/search-simple.png)
## Troubleshoot
- [App & Pod Health Monitoring](https://kubevious.io/docs/features/health-monitoring/) helps troubleshooting Application health degradation from a birds eye view and then guides to a fauly Pod.
![Kubevious Application and Pod Health Monitoring](https://kubevious.io/static/0a863383915cf7de91a2c641eacb82c0/3f20e/app-health.png)

# Contributing
Learn about [Kubevious High-Level Architecture](ARCHITECTURE.md) and to set up local development environment.

# Governance
The Kubevious project is created by [AUTHORS](AUTHORS.md). Governance policy is yet to be defined.

# Roadmap
Kubevious maintains a public [roadmap](ROADMAP.md), which provides priorities and future capabilities we are planning on adding to Kubevious.

# License
Kubevious is an open source project licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0). 

# Community Posts, Reviews and Videos

- [YAKD: Yet Another Kubernetes Dashboard](https://medium.com/geekculture/yakd-yet-another-kubernetes-dashboard-7766bd071f30) by KumoMind
- [A Tour of Kubernetes Dashboards](https://youtu.be/CQZCRMUQynw) by Kostis Kapelonis @ Codefresh
- [Kubevious - Kubernetes GUI that's not so Obvious | DevOps](https://youtu.be/E3giPRiXSVI) by Bribe By Bytes
- [A Walk Through the Kubernetes UI Landscape](https://youtu.be/lsrB21rjSok?t=403) at 6:47 by Henning Jacobs & Joaquim Rocha @ KubeCon North America 2020
- [Tool of the Day: more than a dashboard, kubevious gives you a labeled, relational view of everything running in your Kubernetes cluster](https://www.youtube.com/watch?v=jnhyiVs17OE&t=1571s) by Adrian Goins @ [Coffee and Cloud Native](https://community.cncn.io/)
- [Kubevious: Kubernetes Dashboard That Isn't A Waste Of Time](https://youtu.be/56Z0lGdOIBg) by Viktor Farcic @ [The DevOps Toolkit Series](https://youtube.com/c/TheDevOpsToolkitSeries)
- [Kubevious – a Revolutionary Kubernetes Dashboard](https://codefresh.io/kubernetes-tutorial/kubevious-kubernetes-dashboard/) by [Kostis Kapelonis](https://twitter.com/codepipes) @ CodeFresh
- [TGI Kubernetes 113: Kubernetes Secrets Take 3](https://youtu.be/an9D2FyFwR0?t=1074) at 17:54 by [Joshua Rosso](https://twitter.com/joshrosso) @ VMware
- [Let us take a dig into Kubevious](https://saiyampathak.com/let-us-take-a-dig-into-kubevious-ckea9d9r700muxhs19jtr3xr8) by [Saiyam Pathak](https://twitter.com/saiyampathak) @ Civo Cloud
- [Обзор графических интерфейсов для Kubernetes](https://habr.com/ru/company/flant/blog/506948/) by Oleg Voznesensky @ Progress4GL
- [Useful Interactive Terminal and Graphical UI Tools for Kubernetes](https://www.virtuallyghetto.com/2020/04/useful-interactive-terminal-and-graphical-ui-tools-for-kubernetes.html) by William Lam @ VMware

*If you want your article describing the experience with Kubevious posted here, please submit a PR.*
