# Rules Engine

The **rules engine** is an extension for [Kubevious](https://github.com/kubevious/kubevious) to allow programmable validation and best practices enforcement for configuration and state objects in Kubernetes. Rules engine lets Kubernetes operators define validation custom rules to raise errors and warnings, beyond the built-in checks that come with Kubevious by default (like label mismatch, missing port, misused or overused objects, etc.). 

In addition to raising errors and warnings, the rules engine allows assigning custom markers to identify objects of particular interest. Examples are be publicly accessible applications, namespaces, apps, containers that use excessive resources, overprivileged containers, and many more.

With rules engine organizations can enforce DevOps best practices without changing their existing release processes. Such rules can also help Kubernetes operators to be efficient day in and day out. Since the rules engine was built to allow any custom rule to be defined, applications can be continuously assured to be compliant to company policies and security postulate to enforced.

Rules are defined using a domain-specific language called [Kubik](https://github.com/kubevious/kubik). Kubik follows JavaScript syntax and comes with extensions to allow custom rules to be easily be written and understood.

The easiest way to get started is to make use of a public library of community built rules from [Kubevious Rules Library](https://github.com/kubevious/rules-library).

## Concepts
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


## Writing Rules
sdf

### Target Script Syntax
tbd

### Rule Script Syntax
tbd

### Applying Markers
tbd
