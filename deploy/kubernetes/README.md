## Standard Deployment

```sh
kubectl create namespace kubevious

helm template kubevious \
    --namespace kubevious \
    > kubevious.yaml

kubectl apply -f kubevious.yaml
```

Forwarding the port:

```sh
kubectl get pods --namespace kubevious
kubectl port-forward <pod-name> 4000:4000 --namespace kubevious
```