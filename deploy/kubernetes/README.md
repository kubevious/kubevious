## Standard Deployment
Deploy using Helm:
```sh
kubectl create namespace kubevious

helm template kubevious \
    --namespace kubevious \
    > kubevious.yaml

kubectl apply -f kubevious.yaml
```

## Accessing UI
Setup port forwarding:
```sh
kubectl port-forward $(kubectl get pod -l k8s-app=kubevious-ui -n kubevious -o jsonpath="{.items[0].metadata.name}") 3000:3000 -n kubevious
```
Access from browser: http://localhost:3000
