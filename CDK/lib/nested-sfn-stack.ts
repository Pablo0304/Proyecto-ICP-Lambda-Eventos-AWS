import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

interface SfnStackProps extends cdk.NestedStackProps {
  pipelineName: string;
  stepFunctionsRoleArn: string;
  inspectObjectLambdaArn: string;
  prepareArtifactLambdaArn: string;
  extremeCompressionLambdaArn: string;
  storeFinalObjectLambdaArn: string;
  notifyUserLambdaArn: string;
  artifactsBucketName: string;
  outputBucketName: string;
  snsTopicArn: string;
}

export class SfnStack extends cdk.NestedStack {
  public readonly stateMachineArn: string;

  constructor(scope: Construct, id: string, props: SfnStackProps) {
    super(scope, id, props);

    const definition = `{
  "Comment": "Extreme compression pipeline",
  "StartAt": "InspectObject",
  "States": {
    "InspectObject": {
      "Type": "Task",
      "Resource": "\${InspectObjectLambdaArn}",
      "Parameters": {
        "sourceBucket.$": "$.sourceBucket",
        "sourceKey.$": "$.sourceKey"
      },
      "ResultPath": "$.inspect",
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "States.TaskFailed"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 3,
          "BackoffRate": 2.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "Fail"
        }
      ],
      "Next": "PrepareArtifact"
    },
    "PrepareArtifact": {
      "Type": "Task",
      "Resource": "\${PrepareArtifactLambdaArn}",
      "Parameters": {
        "sourceBucket.$": "$.sourceBucket",
        "sourceKey.$": "$.sourceKey",
        "artifactsBucket": "\${ArtifactsBucketName}"
      },
      "ResultPath": "$.prepared",
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "States.TaskFailed"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 3,
          "BackoffRate": 2.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "Fail"
        }
      ],
      "Next": "ExtremeCompression"
    },
    "ExtremeCompression": {
      "Type": "Task",
      "Resource": "\${ExtremeCompressionLambdaArn}",
      "Parameters": {
        "artifactsBucket.$": "$.prepared.artifactsBucket",
        "artifactKey.$": "$.prepared.artifactKey",
        "compression": {
          "algorithm": "gzip",
          "level": 9
        }
      },
      "ResultPath": "$.compressed",
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "States.TaskFailed"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 2,
          "BackoffRate": 2.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "Fail"
        }
      ],
      "Next": "StoreFinalObject"
    },
    "StoreFinalObject": {
      "Type": "Task",
      "Resource": "\${StoreFinalObjectLambdaArn}",
      "Parameters": {
        "artifactsBucket.$": "$.compressed.artifactsBucket",
        "compressedKey.$": "$.compressed.compressedKey",
        "outputBucket": "\${OutputBucketName}"
      },
      "ResultPath": "$.stored",
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "States.TaskFailed"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 3,
          "BackoffRate": 2.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "Fail"
        }
      ],
      "Next": "NotifyUser"
    },
    "NotifyUser": {
      "Type": "Task",
      "Resource": "\${NotifyUserLambdaArn}",
      "Parameters": {
        "topicArn": "\${SnsTopicArn}",
        "message.$": "States.Format('Compression complete for {}', $.sourceKey)",
        "details.$": "$.stored"
      },
      "ResultPath": "$.notified",
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "States.TaskFailed"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 2,
          "BackoffRate": 2.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "Fail"
        }
      ],
      "End": true
    },
    "Fail": {
      "Type": "Fail",
      "Error": "CompressionFailed",
      "Cause": "Pipeline failure"
    }
  }
}`;

    const stateMachine = new sfn.CfnStateMachine(this, 'CompressionStateMachine', {
      stateMachineName: props.pipelineName,
      roleArn: props.stepFunctionsRoleArn,
      definitionString: cdk.Fn.sub(definition, {
        InspectObjectLambdaArn: props.inspectObjectLambdaArn,
        PrepareArtifactLambdaArn: props.prepareArtifactLambdaArn,
        ExtremeCompressionLambdaArn: props.extremeCompressionLambdaArn,
        StoreFinalObjectLambdaArn: props.storeFinalObjectLambdaArn,
        NotifyUserLambdaArn: props.notifyUserLambdaArn,
        ArtifactsBucketName: props.artifactsBucketName,
        OutputBucketName: props.outputBucketName,
        SnsTopicArn: props.snsTopicArn
      })
    });

    this.stateMachineArn = stateMachine.ref;

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: this.stateMachineArn
    });
  }
}
