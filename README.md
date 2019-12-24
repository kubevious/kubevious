# Kubevious

Modern application deployments are very complex. It is hard to make sense
of existing deployments. **Kubevious** is made to help operators to navigate  infrastructure and deployment configurations.

![Kubevious Intro](docs/screens/intro.png)

## Running Kubevious
Deploy using Helm:

```sh
kubectl create namespace kubevious

cd deploy/kubernetes

helm template kubevious \
    --namespace kubevious \
    > kubevious.yaml

kubectl apply -f kubevious.yaml
```

Setup port forwarding:

```sh
kubectl port-forward $(kubectl get pod -l k8s-app=kubevious-ui -n kubevious -o jsonpath="{.items[0].metadata.name}") 3000:3000 -n kubevious
```

Access from browser: http://localhost:3000
