[![Release](https://img.shields.io/github/v/release/kubevious/kubevious?label=version&color=2ec4b6)](https://github.com/kubevious/kubevious/releases) [![DockerPulls](https://img.shields.io/docker/pulls/kubevious/kubevious?color=ade8f4)](https://hub.docker.com/r/kubevious/kubevious) [![Issues](https://img.shields.io/github/issues/kubevious/kubevious?color=red)](https://github.com/kubevious/kubevious/issues) [![Slack](https://img.shields.io/badge/chat-on%20slack-7b2cbf)](https://kubevious.io/slack) [![Twitter](https://img.shields.io/twitter/url?color=0096c7&logoColor=white&label=Follow&logo=twitter&style=flat&url=https%3A%2F%2Ftwitter.com%2Fkubevious)](https://twitter.com/kubevious)  [![License](https://img.shields.io/badge/License-Apache%202.0-cb997e.svg)](https://opensource.org/licenses/Apache-2.0) ![](https://hit.yhype.me/github/profile?user_id=59004473)

# What is Kubevious?
**Kubevious** (pronounced [kju:bvi:əs]) is an app-centric assurance, validation, and introspection platform for Kubernetes. It helps running modern Kubernetes applications without disasters, and costly outages by continuously validating application manifests, cluster state and configuration. Kubevious detects and prevents errors(_typos, misconfigurations, conflicts, inconsistencies_) and violations of best practices. Our secret sauce is based on the ability to validate across multiple manifests and looking at the configuration from the application vantage point. Kubevious' unique app-centric user interface delivers intuitive insight, introspection and troubleshooting tools for cloud-native applications. It works right out of the box and only takes a couple of minutes to get Kubevious up and running for existing production applications. Kubevious operates inside the cluster with the user interface accessible as a web app and a CLI tool for integration with CI/CD pipelines.

![Kubevious Intro](https://github.com/kubevious/media/raw/master/screens/intro.png)

- [✨ Live Demo](#-live-demo)
- [🏃‍♀️ Running Kubevious](#%EF%B8%8F-running-kubevious)
  - [🔭 Running Kubevious Inside the Cluster](#-running-kubevious-inside-the-cluster)
  - [📺 Running Kubevious CLI - Standalone Tool](#-running-kubevious-cli---standalone-tool)
  - [🛻 Running Kubevious Portable - Outside the Cluster](#ℹ%EF%B8%8F-what-can-you-do-with-kubevious)
- [ℹ️ What can you do with Kubevious?](#ℹ%EF%B8%8F-what-can-you-do-with-kubevious)
  - [💂 Guard](#-guard)	 
  - [✅ Validate](#-validate)
  - [👁️ Observe](#%EF%B8%8F-observe) 
  - [🔬 Introspect](#-introspect)
  - [🕵️‍♂️ Investigate](#%EF%B8%8F%EF%B8%8F-investigate)
  - [🔨 Troubleshoot](#-troubleshoot)
- [🧑🏻‍🤝‍🧑🏿 Community](#-community)
- [📜  License](#-license)
- [📢  What people say about Kubevious](#-what-people-say-about-kubevious)

![Kubevious Intro](https://github.com/kubevious/media/raw/master/videos/intro.gif)
or watch on  <a href="https://youtu.be/oyFN2Hg8N8U" target="_blank">Youtube</a>.

# ✨ Live Demo
Try Kubevious live demo running on a model cluster: <a href="https://demo.kubevious.io" target="_blank">https://demo.kubevious.io</a>.

See the collection of demo videos: <a href="https://www.youtube.com/channel/UCTjfcEFrGjqtSGtry4ySUzQ" target="_blank">https://www.youtube.com/channel/UCTjfcEFrGjqtSGtry4ySUzQ</a>

# 🏃‍♀️ Running Kubevious
Kubevious consists of the following three projects that can be used together as well as independently, depending on the use case.

## 🔭 Running Kubevious Inside the Cluster
Kubevious works with any Kubernetes distribution and runs within the cluster. Deploy using Helm v3.2+:

```sh
kubectl create namespace kubevious

helm repo add kubevious https://helm.kubevious.io

helm upgrade --atomic -i kubevious kubevious/kubevious --version 1.1.1 -n kubevious

kubectl port-forward service/kubevious-ui-clusterip 8080:80 -n kubevious
```
Access from browser: http://localhost:8080

For more details on installation options, visit [Deployment Repository](https://github.com/kubevious/helm).

## 📺 Running Kubevious CLI - Standalone Tool
Kubevious CLI is a standalone tool to validate and detect manifest misconfigurations and issues. It can be easily integrated into the CI/CD pipelines and well as used during the active development of Kubernetes manifests. Learn more about [Kubevious CLI](https://github.com/kubevious/cli).

## 🛻 Running Kubevious Portable - Outside the Cluster
While **Kubevious** was made to run inside the cluster and monitor the cluster it lives in, **[Kubevious Portable](https://github.com/kubevious/portable)** version runs outside the cluster. Usually, that would happen on development machines from where operators would run *kubectl* commands. Kubevious Portable runs inside a single docker container. Kubevious Portable does not have Rule Executing and Time Machine capabilities and is meant for quick sanity check and visualization of Kubernetes clusters and applications. Kubevious Portable connects to clusters defined in kube-config files. See instructions on [running Kubevious Portable here](https://github.com/kubevious/portable#running-kubevious-portable).

# ℹ️ What can you do with Kubevious?

## 💂 Guard
Kubevious Guard is a CLI extension that validates changes for conflicts, misconfigurations, typos, and violations of best practices before they are applied to Kubernetes clusters and have a chance to cause application outage or health degradation. It examines changes as a whole package, not as individual YAML manifests, allowing detection of cross-manifest violations and conflicts. Kubevious Guard follows <a href="https://kubevious.io/docs/built-in-validators/" target="_blank">Built-in Validations</a> and an extensible <a href="https://kubevious.io/docs/features/rules-engine/" target="_blank">Rules Engine</a> to execute the validation logic.

Changes are validated by piping manifests YAML and can be easily integrated into the CI/CD pipeline testing stage. Remember that Kubevious should be deployed in the cluster.

Learn more about Kubevious Guard in this [blog post](https://kubevious.io/blog/post/kubevious-guard-kubernetes-validation-enforcer).

```sh
$ cat manifests.yaml | sh <(curl -sfL https://run.kubevious.io/validate.sh)
$ kubectl apply -f manifests.yaml
```

![Kubevious Guard Intro](https://github.com/kubevious/media/raw/master/videos/guard-intro.gif)

## ✅ Validate
Kubevious continuously validates cluster configuration and state for misconfigurations, typos, and violations of best practices. 

- <a href="https://kubevious.io/docs/built-in-validators/" target="_blank">Built-in Validations</a> include a comprehensive library of rules to detect and prevent DevOps/SRE focused misconfigurations.

- <a href="https://kubevious.io/docs/features/rules-engine/" target="_blank">Rules Engine</a> provides an intuitive policy language for custom extensions of validation logic using a JavaScript-like if-then-else syntax. **Rules Engine** allows enforcement of complex cross-manifest policies.

## 👁️ Observe
Kubevious analyses Kubernetes cluster configuration and state and presents it graphically into multiple domain-focused views. You can learn more about Kubevious UI <a href="https://kubevious.io/docs/features/application-centric-ui/" target="_blank">
here
</a>.

- **Logic View** is focused on app-centricity, where container, compute, networking, storage, and RBAC related manifests correlated and grouped under Application nodes.
- **Image View** is focused on container images and container image repositories used in the cluster.
- **Gateway View** provides visibility regarding how applications are exposed to the public using Ingresses and API Gateways.
- **RBAC View** identifies how Users and Groups are used in the cluster.
- **Package View** provides visibility to Helm charts installed in the Kubernetes cluster.

![Cluster and Configs in an Application Centric View](https://kubevious.io/static/b4e981857c1b19c3d5b6c452ff17eadb/3f20e/main-ui-hints.png)

## 🔬 Introspect
Kubevious provides insights optimized for specific roles and responsibilities as well as correlated app-centric views.

- <a href="https://kubevious.io/docs/features/cloud-native-tools/correlated-rbac/" target="_blank">Correlated RBAC</a>. Understand which permissions are granted to Applications through ServiceAccounts, RoleBindings, and Roles.
![Kubevious Correlated RBAC](https://kubevious.io/static/553c48aa1fb6426d57c9d51996a4a371/3f20e/selected-service-account.png)

- <a href="https://kubevious.io/docs/features/cloud-native-tools/correlated-network-policies/" target="_blank">Correlated Network Policies</a>. Understand how NetworkPolicies are affecting applications and which traffic is allowed.
![Kubevious Network Policies Correlated](https://kubevious.io/static/ca9090ba03b8fd0b4d73fe1b7466cf29/3f20e/network-policies.png)

- <a href="https://kubevious.io/docs/features/cloud-native-tools/identifying-blast-radius/" target="_blank">Identifying Blast Radius</a>. Identify shared resources within the cluster.

- <a href="https://kubevious.io/docs/features/cloud-native-tools/radioactive-workloads/" target="_blank">Radioactive Workloads</a>. Identify applications that have excessive permissions.

- <a href="https://kubevious.io/docs/features/cloud-native-tools/capacity-planning-and-resource-usage-optimization/" target="_blank">Capacity Planning and Resource Usage Optimization</a>. Identify how much of cluster resources are used by Applications and Namespaces.

## 🕵️‍♂️ Investigate
- <a href="https://kubevious.io/docs/features/time-machine/" target="_blank">Time Machine</a> lets you travel back in time, investigate cluster configuration and state, audit applications, root cause outages, and recover good and working manifests. Time Machine works by extracting resources directly from the Kubernetes API server, meaning that it keeps track of all changes, including ones made by k8s operators. 
![Kubevious Time Machine](https://kubevious.io/static/452c7f6c9960b3dedfd41baea7567ee6/3f20e/time-machine-active.png)

- <a href="https://kubevious.io/docs/features/search-engine/" target="_blank">Search Engine</a> is a like full-text search engine to find and return Kubernetes manifests matching various search criteria.
![Kubevious Search Engine](https://kubevious.io/static/d2f0c37d574441032aa8dfb57332d17f/3f20e/search-simple.png)

## 🚒 Troubleshoot
- <a href="https://kubevious.io/docs/features/health-monitoring/" target="_blank">App & Pod Health Monitoring</a> helps you troubleshoot degradations of Application health with intuitive built-in tools that direct you to the source of the problem.
![Kubevious Application and Pod Health Monitoring](https://kubevious.io/static/0a863383915cf7de91a2c641eacb82c0/3f20e/app-health.png)

# 🧑🏻‍🤝‍🧑🏿 Community

## 💬 Slack
Join the [Kubevious Slack workspace](https://kubevious.io/slack) to chat with Kubevious developers and users. This is a good place to learn about Kubevious, ask questions, and share your experiences.

## 🎉 Events
Follow our virtual and in-person events on [Meetup](https://www.meetup.com/kubevious/) or [Google Calendar](https://calendar.google.com/calendar/u/0?cid=Y19ndTlkM2p1c2lxNDRkbXBnamJoMTlva2Rvb0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t).

### 🎤 Weekly Community Meeting
Kubevious contributors and users gather every Thursday @ 9 am PDT for a [Zoom call](https://us06web.zoom.us/j/81673703834?pwd=WWc4bUF6RzJDQXdOM2pUSlpvZ1JYZz09). Everyone is welcome to join. During the call, we discuss:
- The current state of Kubevious
- Upcoming development items
- Any other community-relevant topics during the open session

If you want to discuss something during the next meeting's open session, you can let us know in the **#weekly-meeting** channel of our [Slack workspace](https://kubevious.io/slack).

### ☕ Kubernetes + Espresso in Bay Area
Stop by to have a coffee with us and discuss Kubernetes and Cloud-Native. Takes place every Friday @ 12:30pm in the Bay Area. Location will alternate between Peninsula and East Bay.

Next event on June 17 @ 12:30PM in Palo Alto, CA

RSVP: https://www.meetup.com/kubevious/events/286399220/

## 🏗️ Contributing
We invite your participation through issues and pull requests! You can peruse the [contributing guidelines](CONTRIBUTING.md).

## 🏛️ Governance
The Kubevious project is created by [AUTHORS](AUTHORS.md). Governance policy is yet to be defined.

## 🚀 Roadmap
Kubevious maintains a public [roadmap](ROADMAP.md), which provides priorities and future capabilities we are planning on adding to Kubevious.

# 📜 License
Kubevious is an open-source project licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0). 

# 📢 What people say about Kubevious

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
