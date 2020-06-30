# Rules Engine

The **rules engine** is an extension for [Kubevious](https://github.com/kubevious/kubevious) to allow programmable validation and best practices enforcement for configuration and state objects in Kubernetes. Rules engine lets Kubernetes operators define validation custom rules to raise errors and warnings, beyond the built-in checks that come with Kubevious by default (like label mismatch, missing port, misused or overused objects, etc.). 

In addition to raising errors and warnings, the rules engine allows assigning custom markers to identify objects of particular interest. Examples are be publicly accessible applications, namespaces, apps, containers that use excessive resources, overprivileged containers, and many more.

With rules engine organizations can enforce DevOps best practices without changing their existing release processes. Such rules can also help Kubernetes operators to be efficient day in and day out. Since the rules engine was built to allow any custom rule to be defined, applications can be continuously assured to be compliant to company policies and security postulate to enforced.

Rules are defined using a domain-specific language called [Kubik](https://github.com/kubevious/kubik). Kubik follows JavaScript syntax and comes with extensions to allow custom rules to be easily be written and understood.

The easiest way to get started is to make use of a public library of community built rules from [Kubevious Rules Library](https://github.com/kubevious/rules-library). While this page conaints comprehensive documentation on writing custom rules, consider joining [Kubevious Slack Channel](https://kubevious.io/slack/) for any additional assistance.

## Introduction
Rules can be defined towards any object and configuration present in Kubevious UI, for example, Deployments, Pods, ConfigMaps, PersistentVolumes, Ingresses, and any other Kubernetes or synthetic configurations. 

![Kubevious UI Diagram for Rules Engine](https://github.com/kubevious/media/raw/master/screens/rules-engine/rules-engine-diagram-view.png)

Rules consist of two parts: target and rule scripts. The **target script** declares on which nodes of the diagram should the validation rule be evaluated. Rules engine would then pass along the selected nodes to the **rule script**, where nodes would be checked, and rule engine would trigger errors and warnings, or label them with custom markers on such selected nodes.

## Getting Started
Rules are defined in *Rule Editor* window of Kubevious. In the screenshot below the rule *latest-tag-check* targets all docker images and checks if latest image tag is used. For such images an error is triggered.  

![Kubevious Rule Editor Target Script](https://github.com/kubevious/media/raw/master/screens/rules-engine/rule-editor-target-script.png)

An optional message can be passed to **error** to provide more detailed description of the error and sometimes remediation instructions.

![Kubevious Rule Editor Rule Script](https://github.com/kubevious/media/raw/master/screens/rules-engine/rule-editor-rule-script.png)

The *Affected Objects* shows Images that are using latest tag. Items in the list are shortcust and clicking on them would navigate to the diagram.

![Kubevious Rule Editor Affected Objects](https://github.com/kubevious/media/raw/master/screens/rules-engine/rule-editor-affected-errors.png)

The Image object in the diagram, along with properties and alerts triggered. In Universe view operators can easily check for other relevant configurations. 

![Kubevious UI Diagram for Rules Engine](https://github.com/kubevious/media/raw/master/screens/rules-engine/rules-engine-diagram-view.png)

Sometimes classifying objects by errors or warnings is not sufficient. **Marker Editor** allows assigning arbitrary icons to objects using rules engine. They can be used for quick access or for purposes of better categorization.

![Kubevious Marker Editor](https://github.com/kubevious/media/raw/master/screens/rules-engine/marker-editor.png)

Just like in case of rule editor window, list of items that match the condition is listed in *Affected Objects* tab.

![Kubevious Marker Editor Affected Objects](https://github.com/kubevious/media/raw/master/screens/rules-engine/rule-editor-affected-markers.png)

## Concepts
Validations in rules engine are applied on items of the diagram. Every item in the diagram is defined using its **kind** and **name**. Items have sets of property groups associated. They are visible in the *Properties* window of selected item. Such property groups can hold raw YAML configuration, or synthetic key-value pairs of additional properies, labels, annotation, etc. Property groups can be used in the diagram to filter items and use in conditions to associate errors, warning, and custom markers.

Diagram has a graph like structure, so rules have a capability of graph traversal.

![Kubevious Diagram Node](https://github.com/kubevious/media/raw/master/screens/rules-engine/diagram-node.png)


## Target Script Syntax
The purpose of the target script is to select a items from the diagram that matches required criteria. The selected items are be passed along to the rule script for validation.

The target script starts with **select** statement that takes the  **kind** as an input. That statement selects all nodes of the given kind. The best place to discover is all item *kind*'s is the diagram viewer, but the most commonly used ones are:

| Kind                    | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| Namespace               | Kubernetes namespace                                         |
| Application             | An abstraction that represents a workload and associated configurations like Services, Ingresses, ConfigMaps, Volumes, Pods, etc. |
| Launcher                | A controller that launches the application. It represents either a Deployment, StatefulSet or a DaemonSet |
| Container               | An individual container spec from Deployment, StatefulSet or a DaemonSet |
| Init Container          | An individual init container spec from Deployment, StatefulSet or a DaemonSet |
| Image                   | A synthetic item representing a container image used inside the Container or Init Container |
| Volume                  | A volume spec from Container or Init Container               |
| ConfigMap               | A ConfigMap which is associated to Container. Can be directly under the Container if used as environment variables, or under Volume if mounted. |
| Port                    | A container port definition                                  |
| Service                 | A Kubernetes Service. Can be present directly under the Application or under the Port |
| Ingress                 | A Kubernetes Ingress. Can be present directly under the Application or under the Service |
| Service Account         | A Kubernetes ServiceAccount. Present under the Application   |
| Cluster Role Binding    | A Kubernetes ClusterRoleBinding. Present under the Service Account |
| Role Binding            | A Kubernetes RoleBinding. Present under the Service Account  |
| Cluster Role            | A Kubernetes ClusterRole. Present under the Cluster Role Binding or Role Binding |
| Pod Security Policy     | A Kubernetes PodSecurityPolicy. Present under Cluster Role.  |
| Role                    | A Kubernetes Role. Present under the Role Binding            |
| Replicaset              | A Kubernetes ReplicaSet. Present under Launcher.             |
| Pod                     | A Kubernetes Pod. Present under ReplicaSet for Deployment and DaemonSet. Directly under Launcher for StatefulSet. |
| Persistent Volume Claim | A Kubernetes PVC. Present under Pod.                         |
| Persistent Volume       | A Kubernetes Persistent Volume. Present under Persistent Volume Claim. |
| Infra                   | A placeholder item for infrastructure related items.         |
| Nodes                   | A group for Kubernetes nodes. Present under Infra item.      |
| Node                    | A Kubernetes Node. Present under Nodes.                      |

### Selecting all items of a given kind
Every target script should start with a **select** statement. Using the example below all Pods would be passed to rule script for validation.

```js
select('Pod')
```

Other examples could be selecting container images:
```js
select('Image')
```

or PodSecurityPolicies:

```js
select('Pod Security Policy')
```

### Filtering items by name
Items can be filtered by name:
```js
select('Image')
    .name('mongo')
```

or by multiple names:

```js
select('Container')
    .name('sidecar')
    .name('logger')
```

### Filtering items by labels
Items can be filtered by one label:
```js
select('Application')
    .label('stage', 'prod')
```

by multiple labels to be matched:
```js
select('Application')
    .labels({ 
        stage: 'pre-prod',
        region: 'east'
    })
```

or by combining multiple label query results. Example below will select all production apps, and preproduction apps from us-east region:
```js
select('Application')
    .label('stage', 'prod')
    .labels({
        stage: 'pre-prod',
        region: 'us-east'
    })
```

### Filtering items by annotations
Just like in case of labels, items can be filtered by annotations:
```js
select('Ingress')
    .annotation('kubernetes.io/ingress.class', 'nginx')
```

by multiple annotations to be matched:
```js
select('Ingress')
    .annotation('kubernetes.io/ingress.class', 'nginx')
    .annotation('kubernetes.io/ingress.class', 'traefik')
```

or by combining multiple annotation query results:
```js
select('Ingress')
    .annotation('kubernetes.io/ingress.class', 'traefik')
    .annotations({
        'kubernetes.io/ingress.class': 'nginx',
        'nginx.ingress.kubernetes.io/enable-cors': false
    })
```

### Executing custom code filters
Items can be also be filtered by arbitrary code using JavaScript syntax. The example below selects Deployments that have *dnsPolicy* set to *ClusterFirst*. The **filter** should return **true** or **false** to indicate whether the item should be included. Multiple filters can be used, and for the item to be passed along to rule script, all the filter functions should return **true**. The **item.config** would represent the actual YAML file provided by Kubernetes.
```js
select('Launcher')
    .name('Deployment')
    .filter({item} => {
        if (item.config.spec.template.dnsPolicy == 'ClusterFirst') {
            return true;
        }
        return false;
    })
```

Filters can also access synthetic properties. The target script below selects applications that are exposed to public internet and are running less than 3 pod repicas.
```js
select('Application')
    .filter({item} => {
        return
            (item.props['Replicas'] < 3) &&
            (item.props['Exposed'] == 'With Ingress');
    })
```

The same result can be achieved by fetching replicas from the config object, and checking whether there is an Ingress item underneath.
```js
select('Application')
    .filter({item} => {
        return
            (item.config.spec.replicas < 3) &&
            item.hasDescendants('Ingress');
    })
```

## Rule Script Syntax

tbd

## Applying Markers
tbd
