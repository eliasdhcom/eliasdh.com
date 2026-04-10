#!/bin/sh
############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################

NAMESPACE="${NAMESPACE:-eliasdhcom}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

get_deployments() { kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}'; }

get_running_image() { kubectl get deployment "$1" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}'; }

get_latest_tag() {
    IMAGE_PATH=$(echo "$1" | sed 's|ghcr.io/||' | cut -d: -f1)
    curl -s "https://api.github.com/users/${IMAGE_PATH%%/*}/packages/container/${IMAGE_PATH##*/}/versions" -H "Authorization: Bearer ${GITHUB_TOKEN}" | jq -r '.[0].metadata.container.tags[0]' 2>/dev/null
}

log "Starting — namespace: $NAMESPACE interval: ${CHECK_INTERVAL}s"

while true; do
    for DEPLOYMENT in $(get_deployments); do
        FULL_IMAGE=$(get_running_image "$DEPLOYMENT")
        RUNNING_TAG=$(echo "$FULL_IMAGE" | awk -F: '{print $NF}')
        LATEST_TAG=$(get_latest_tag "$FULL_IMAGE")

        [ -z "$LATEST_TAG" ] || [ -z "$RUNNING_TAG" ] && log "WARN: $DEPLOYMENT — kon versies niet ophalen" && continue
        [ "$RUNNING_TAG" = "$LATEST_TAG" ] && log "OK: $DEPLOYMENT — $RUNNING_TAG" && continue

        log "MISMATCH: $DEPLOYMENT — running=$RUNNING_TAG latest=$LATEST_TAG"
        kubectl rollout restart deployment "$DEPLOYMENT" -n "$NAMESPACE"
    done
    sleep "$CHECK_INTERVAL"
done