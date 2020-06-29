# Rules Engine

The **rules engine** is an extension for Kubevious to allow programmable validation and best practices enforcement for configuration and state objects in Kubernetes. Rules engine lets Kubernetes operators define validation custom rules to raise errors and warnings, beyond the built-in checks that come with Kubevious by default (like label mismatch, missing port, misused or overused objects, etc.). In addition to raising errors and warnings, the rules engine allows assigning custom markers to identify objects of particular interest. Examples could be publicly accessible applications, namespaces, apps, containers that use excessive resources, overprivileged containers, and many more.

Rules are defined using a domain-specific language called [Kubik](https://github.com/kubevious/kubik). Kubik follows JavaScript syntax and comes with extensions to allow custom rules to be easily be written and understood.

The easiest way to get started is to make use of a public library of community built rules from [Kubevious Rules Library](https://github.com/kubevious/rules-library).

## Concepts
Rules can be defined towards any object and configuration present in Kubevious UI, for example, Deployments, Pods, ConfigMaps, PersistentVolumes, Ingresses, and any other Kubernetes or synthetic configurations. 

![Kubevious UI](https://github.com/kubevious/media/raw/master/screens/app-view.png)

Rules consist of two parts: target and rule scripts. The target script declares on which nodes of the diagram should the validation rule be evaluated. Rules engine would then pass along the selected nodes to the rule script, where nodes would be checked, and rule engine would trigger errors and warnings, or label them with custom markers on such selected nodes.


## Getting Started
asdf

![Kubevious UI](https://github.com/kubevious/media/raw/master/screens/rules-engine/rule-editor-target-script.png)

![Kubevious UI](https://github.com/kubevious/media/raw/master/screens/rules-engine/rule-editor-rule-script.png)

![Kubevious UI](https://github.com/kubevious/media/raw/master/screens/rules-engine/rule-editor-affected-errors.png)

![Kubevious UI](https://github.com/kubevious/media/raw/master/screens/rules-engine/rules-engine-diagram-view.png)

Markers

![Kubevious UI](https://github.com/kubevious/media/raw/master/screens/rules-engine/marker-editor.png)

![Kubevious UI](https://github.com/kubevious/media/raw/master/screens/rules-engine/rule-editor-affected-markers.png)


## Writing Rules
sdf

### Target Script Syntax
tbd

### Rule Script Syntax
tbd