#!/usr/bin/env bash
set -euo pipefail

PIPELINE_NAME="alucloud85"

INPUT_BUCKET="${PIPELINE_NAME}-input"
ARTIFACTS_BUCKET="${PIPELINE_NAME}-artifacts"
OUTPUT_BUCKET="${PIPELINE_NAME}-output"

for b in "${INPUT_BUCKET}" "${ARTIFACTS_BUCKET}" "${OUTPUT_BUCKET}"; do
  echo "Emptying s3://${b}"
  aws s3 rm "s3://${b}" --recursive --profile default
  echo "Done: s3://${b}"
  echo
done

STACK_NAME="STACK-Proyecto-IPC-85"

echo "Deleting CloudFormation stack ${STACK_NAME}"
aws cloudformation delete-stack --stack-name ${STACK_NAME} --profile default

echo "Waiting for stack deletion to complete..."
aws cloudformation wait stack-delete-complete --stack-name ${STACK_NAME} --profile default
echo "Stack deletion complete."