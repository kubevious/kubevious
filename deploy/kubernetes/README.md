## Standard Deployment

```sh
helm template kubevious \
    --namespace kubevious \
    > kubevious.yaml

kubectl create namespace kubevious
kubectl apply -f kubevious.yaml
```