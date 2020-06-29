# Rules Engine

The **rules engine** is an extension for Kubevious to allow programmable validation and best practices enforcement for configuration and state objects in Kubernetes. Rules engine lets Kubernetes operators define validation custom rules to raise errors and warnings, beyond the built-in checks that come with Kubevious by default (like label mismatch, missing port, misused or overused objects, etc.). In addition to raising errors and warnings, the rules engine allows assigning custom markers to identify objects of particular interest. Examples could be publicly accessible applications, namespaces, apps, containers that use excessive resources, overprivileged containers, and many more.

