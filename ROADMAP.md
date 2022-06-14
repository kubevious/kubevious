# Kubevious Roadmap

Kubevious started as an application-centric viewer and an introspection tool to help people clearly understand what is going on in their applications and clusters. With time, it grew into a sophisticated rule engine for detecting configuration and state anomalies, best practices violations, and errors (typos, misconfigurations, conflicts, inconsistencies).

Our vision of Kubevious is to become a full-fledged assurance and validation platform to keep your Kubernetes clusters safe and error-free, in compliance with the latest industry standards and best practices applied across multiple domains and components of the Cloud-Native stack.

## Major Focus Areas
For a finer-granularity view, and insight into detailed enhancements and fixes, please refer to [issues on GitHub](https://github.com/kubevious/kubevious/issues).

### Kubevious Guard
[Kubevious Guard](https://github.com/kubevious/kubevious/issues/65) is a proposal to implement validation enforcement based on the build-in validations and rules engine used in Kubevious.

### Community-Driven Rules Library
Proposal to implement [Public Library of Best Practices Enforcement Rules](https://github.com/kubevious/kubevious/issues/66).

### 3rd Party Support
The most significant power of Kubernetes is its ecosystem. Many projects in the Cloud-Native ecosystem work perfectly together on top of Kubernetes. We want to add native support in Kubevious to analyze, validate and troubleshoot the most widely adopted ones.

#### Cert-Manager
Proposal to implement [Cert-Manager](https://github.com/kubevious/kubevious/issues/68) support in Kubevious.

#### API Gateway
Proposal to implement [API Gateway](https://github.com/kubevious/kubevious/issues/63) support in Kubevious. Based on the community interest we would pick the first API Gateway to work on. Could be Traefik, Kong, Istio, Ambassador, Skipper, or other.



