#!/bin/bash

source /scripts/common.sh
source /scripts/bootstrap-helm.sh


run_tests() {
    echo Running tests...

    wait_pod_ready mongodb-0 default 2/2
    wait_pod_ready mongodb-1 default 2/2
    wait_pod_ready mongodb-arbiter-0
    wait_pod_ready otv-backend-0

    express_pod=$(kubectl get pods | grep express | cut -d' ' -f1)
    wait_pod_ready $express_pod
}

teardown() {
    retval=$?
    if [ $retval -ne 0 ]; then
        kubectl describe pod otv-backend-0 
        kubectl logs -l app=otv-backend

    fi

    helmfile delete --purge
    exit $retval
}

main(){
    if [ -z "$KEEP_W3F_OTV_BACKEND" ]; then
        trap teardown EXIT
    fi

    /scripts/build-helmfile.sh
    run_tests
}

main
