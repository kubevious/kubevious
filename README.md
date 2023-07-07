[![Release](https://img.shields.io/github/v/release/kubevious/kubevious?label=version&color=2ec4b6)](https://github.com/kubevious/kubevious/releases) [![DockerPulls](https://img.shields.io/docker/pulls/kubevious/kubevious?color=ade8f4)](https://hub.docker.com/r/kubevious/kubevious) [![Issues](https://img.shields.io/github/issues/kubevious/kubevious?color=red)](https://github.com/kubevious/kubevious/issues) [![Slack](https://img.shields.io/badge/chat-on%20slack-7b2cbf)](https://kubevious.io/slack) [![Twitter](https://img.shields.io/twitter/url?color=0096c7&logoColor=white&label=Follow&logo=twitter&style=flat&url=https%3A%2F%2Ftwitter.com%2Fkubevious)](https://twitter.com/kubevious)  [![License](https://img.shields.io/badge/License-Apache%202.0-cb997e.svg)](https://opensource.org/licenses/Apache-2.0) ![](https://hit.yhype.me/github/profile?user_id=59004473)

**Kubevious** (pronounced [kju:bvi:əs]) is a suite of app-centric assurance, validation, and introspection products for Kubernetes. It helps running modern Kubernetes applications without disasters and costly outages by continuously validating application manifests, cluster state, and configuration. Kubevious projects detect and prevent errors(_typos, misconfigurations, conflicts, inconsistencies_) and violations of best practices. Our secret sauce is based on the ability to validate across multiple manifests and look at the configuration from the application vantage point.

- Projects:
  - [📺 Kubevious CLI](#kubevious-cli)
  - [🔭 Kubevious Dashboard](#kubevious-dashboard)
- [🧑🏻‍🤝‍🧑🏿 Community](#-community)
  - [💬 Slack](#-slack) 
  - [🏗️ Contributing](#️-contributing)
  - [🏛️ Governance](#️-governance)
  - [🚀 Roadmap](#-roadmap)
- [📜 License](#-license)
- [📢 What people say about Kubevious](#-what-people-say-about-kubevious)


<!--
  - [🎉 Events](#-events)
    - [🎤 Weekly Community Meeting](#-weekly-community-meeting)
    - [☕ Kubernetes + Espresso in Bay Area](#-kubernetes--espresso-in-bay-area)
-->   

# Kubevious CLI

Kubevious CLI is a standalone tool that validates YAML manifests for syntax, semantics, conflicts, compliance, and security best practices violations. Can be easily used during active development and integrated into GitOps processes and CI/CD pipelines to validate changes toward live Kubernetes clusters. This is our newest development was based on the lessons learned and the foundation of the Kubevious Dashboard. 

Learn more about securing your Kubernetes apps and clusters here: [https://github.com/kubevious/cli](https://github.com/kubevious/cli)

![Kubevious CLI Video](https://raw.githubusercontent.com/kubevious/media/master/cli/intro/demo_light.gif)



# Kubevious Dashboard

Kubevious Dashboard is a web app that delivers unique app-centric intuitive insights, introspects Kubernetes manifests, and provides troubleshooting tools for cloud-native applications. It works right out of the box and only takes a few minutes to get Kubevious up and running for existing production applications.

Learn more about introspecting Kubernetes apps and clusters here: [https://github.com/kubevious/kubevious/blob/main/projects/DASHBOARD.md](https://github.com/kubevious/kubevious/blob/main/projects/DASHBOARD.md)

![Kubevious Intro](https://github.com/kubevious/media/raw/master/videos/intro.gif)


# 🧑🏻‍🤝‍🧑🏿 Community

## 💬 Slack
Join the [Kubevious Slack workspace](https://kubevious.io/slack) to chat with Kubevious developers and users. This is a good place to learn about Kubevious, ask questions, and share your experiences.

<!--
## 🎉 Events
Follow our virtual and in-person events on [Meetup](https://www.meetup.com/kubevious/) or [Google Calendar](https://calendar.google.com/calendar/u/0?cid=Y19ndTlkM2p1c2lxNDRkbXBnamJoMTlva2Rvb0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t).

### 🎤 Weekly Community Meeting
Kubevious contributors and users gather every Thursday @ 9 am PDT for a [Zoom call](https://us06web.zoom.us/j/84115047636?pwd=cW1meEt4Y3puSStpVkZvTDZOeFdjZz09). Everyone is welcome to join. During the call, we discuss:
- The current state of Kubevious
- Upcoming development items
- Any other community-relevant topics during the open session

If you want to discuss something during the next meeting's open session, you can let us know in the **#weekly-meeting** channel of our [Slack workspace](https://kubevious.io/slack).

### ☕ Kubernetes + Espresso in Bay Area
Stop by to have a coffee with us and discuss Kubernetes and Cloud-Native. Takes place every Friday @ 12:30pm in the Bay Area. Location will alternate between Peninsula and East Bay.

Next event on June 17 @ 12:30PM in Palo Alto, CA

RSVP: https://www.meetup.com/kubevious/events/286399220/
-->

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
