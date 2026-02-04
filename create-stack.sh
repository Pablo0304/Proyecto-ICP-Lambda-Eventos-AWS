#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="STACK-Proyecto-IPC-85"
TEMPLATE_URL="https://alucloud.s3.us-east-1.amazonaws.com/85/main-stack.json"

aws cloudformation create-stack \
  --stack-name "${STACK_NAME}" \
  --template-url "${TEMPLATE_URL}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile default

echo "Waiting for stack creation to complete..."
aws cloudformation wait stack-create-complete --stack-name "${STACK_NAME}" --profile default
echo "Stack creation complete."