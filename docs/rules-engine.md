# Rules Engine

- [What is Rules Engine?](#what-is-rules-engine)
- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Concepts](#concepts)
- [Target Script Syntax](#target-script-syntax)
- [Rule Script Syntax](#rule-script-syntax)
- [Applying Markers](#applying-markers)


## What is Rules Engine?
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
Items can be filtered by arbitrary code using JavaScript syntax. The example below selects Deployments that have *dnsPolicy* set to *ClusterFirst*. The **filter** should return **true** or **false** to indicate whether the item should be included or not. Multiple filters can be used, and for the item to be passed along to rule script, all the filter functions should return **true**. The **item.config** would represent the actual YAML file provided by Kubernetes.
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

Filters can also access synthetic properties. The target script below selects applications that are exposed to public internet and are running less than 3 pod replicas.
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

### Filtering based on synthetic property groups
Kubevious produces synthetic property grougs by joining multiple configurations from Kubernetes to improve overall Kubernetes usability. Such synthetic properties can be accessed inside target and rule scripts. One good example is Resource Role Matrix on Service Account item, which combines permissions across relevant (Cluster) Role Bindings and (Cluster) Roles.

![Kubevious Diagram Resource Role Matrix Secret](https://github.com/kubevious/media/raw/master/screens/rules-engine/diagram-resource-role-matrix-secret.png)

The targe script below selects applications that requests permission to access Kubernetes secrets. Because Service Accounts are directly underneath Appications, the **children** function can be used instead of **descendants**.
```js
select('Application')
    .filter(({item}) => {
  	      for(var svcAccount of item.children('Service Account'))
          {
               var roleMatrix = svcAccount.getProperties('resource-role-matrix');
               for(var row of roleMatrix.rows)
               {
                     if (row.resource == 'secrets')
                     {
                         return true;
                     }
               }
          }
         return false;
    })
```

The targets of the script above are Application items, meaning that errors, warnings or markers would be applied on Application items. We could rewrite the script to target Service Accounts instead. The script can be as complex as it needs to be in order to validate criteria as verbs used (get, update, delete, etc), namespace and name.
```js
select('Service Account')
    .filter(({item}) => {
        var roleMatrix = item.getProperties('resource-role-matrix');
        for(var row of roleMatrix.rows)
        {
            if (row.resource == 'secrets')
            {
                return true;
            }
        }
        return false;
    })
```

### Traversing Hierarchy
Rules engine allows breadth-first tree traversal by specifying layers of interest. Followed by the **select** statement, the **child** and **descendant** indicate which items to visit during the subsequent pass.

Lets consider following example below:
```js
select('Namespace')
    .filter(({item}) => item.name != 'kube-system')
    .filter(({item}) => {
        const cpu = item.getProperties('cluster-consumption').cpu;
        const memory = item.getProperties('cluster-consumption').memory;
        return (unit.percentage(cpu) >= 40) ||
               (unit.percentage(memory) >= 35);
    })
.child('Application')
    .filter(({item}) => item.props['Replicas'] >= 10)
    .filter(({item}) => !item.hasDescendants('Persistent Volume Claim'))
```
The script selects stateful Applications (no Persistent Volume Claims), that are running more than 10 pods,  those Applications are within the non "kube-system" Namespace, the Namespace consumes more than 40% of overall cluster CPU and more than 35% of overall cluster memory. 

The **child** and **descendant** selectors can be chained together. While **child** selects direct children, the **descendant** selects items of a specified **kind** within the entire sub-tree.
```js
select('Namespace')
    .label('region', 'west')
.child('Application')
    .label('stage', 'prod')
    .filter(({item}) => item.hasDescendants('Persistent Volume Claim'))
.descendant('Image')
    .filter(({item}) => item.props.tag == 'latest')
```
The script above selects container Images that are using **latest** tag, in stateful applications that are running in **production** deployed to region **west**.

## Rule Script Syntax
The purpose of rule script is to act upon items that passed target script filters. Rule scripts can perform further checks but eventually should call **error**, **warning** or **mark**  to label items as such.


| Action           | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| **error**(msg)   | Triggers an error on the item. An optional message can be provided. |
| **warning**(msg) | Triggers a warning on the item. An optional message can be provided. |
| **mark**(name)   | Marks the item with the specified marker.                    |

Within the body of the rule script an **item** variable (identical to the one used in *filter* function of target script) can be used to determine what kind of severity, message and mark to attach.

Lets consider the simple case of triggering errors on latest image tags.

<hr />

#### Target Script
```js
select('Image')
    .filter(({item}) => (item.props.tag == 'latest'))
```
#### Rule Script
```js
error("You are using latest image. Please dont do that.");
```

<hr />

Another way of achieving the same outcome is targeting all Images, but filtering out  latest tags within the rule script:

<hr />

#### Target Script
```js
select('Image')
```
#### Rule Script
```js
if (item.props.tag == 'latest') {
    error("You are using latest image. Please dont do that.");
}
```

<hr />


## Applying Markers
tbd

