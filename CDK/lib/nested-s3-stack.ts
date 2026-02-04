import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface S3StackProps extends cdk.NestedStackProps {
  pipelineName: string;
  startStateMachineLambdaArn: string;
}

export class S3Stack extends cdk.NestedStack {
  public readonly inputBucketName: string;
  public readonly artifactsBucketName: string;
  public readonly outputBucketName: string;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    const invokePermission = new lambda.CfnPermission(
      this,
      'StartStateMachineInvokePermission',
      {
        action: 'lambda:InvokeFunction',
        functionName: props.startStateMachineLambdaArn,
        principal: 's3.amazonaws.com',
        sourceArn: cdk.Fn.sub('arn:aws:s3:::${PipelineName}-input', {
          PipelineName: props.pipelineName
        })
      }
    );

    const inputBucket = new s3.CfnBucket(this, 'InputBucket', {
      bucketName: cdk.Fn.sub('${PipelineName}-input', {
        PipelineName: props.pipelineName
      }),
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          { serverSideEncryptionByDefault: { sseAlgorithm: 'AES256' } }
        ]
      },
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      },
      notificationConfiguration: {
        lambdaConfigurations: [
          {
            event: 's3:ObjectCreated:*',
            function: props.startStateMachineLambdaArn
          }
        ]
      }
    });
    inputBucket.addDependency(invokePermission);

    const artifactsBucket = new s3.CfnBucket(this, 'ArtifactsBucket', {
      bucketName: cdk.Fn.sub('${PipelineName}-artifacts', {
        PipelineName: props.pipelineName
      }),
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          { serverSideEncryptionByDefault: { sseAlgorithm: 'AES256' } }
        ]
      },
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      }
    });

    const outputBucket = new s3.CfnBucket(this, 'OutputBucket', {
      bucketName: cdk.Fn.sub('${PipelineName}-output', {
        PipelineName: props.pipelineName
      }),
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          { serverSideEncryptionByDefault: { sseAlgorithm: 'AES256' } }
        ]
      },
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      },
      lifecycleConfiguration: {
        rules: [
          {
            id: 'ColdStorageLifecycle',
            status: 'Enabled',
            transitions: [
              { storageClass: 'STANDARD_IA', transitionInDays: 30 },
              { storageClass: 'GLACIER', transitionInDays: 90 },
              { storageClass: 'DEEP_ARCHIVE', transitionInDays: 180 }
            ]
          }
        ]
      }
    });

    this.inputBucketName = inputBucket.ref;
    this.artifactsBucketName = artifactsBucket.ref;
    this.outputBucketName = outputBucket.ref;

    new cdk.CfnOutput(this, 'InputBucketName', { value: this.inputBucketName });
    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: this.artifactsBucketName
    });
    new cdk.CfnOutput(this, 'OutputBucketName', {
      value: this.outputBucketName
    });
    new cdk.CfnOutput(this, 'InputBucketArn', {
      value: inputBucket.attrArn
    });
    new cdk.CfnOutput(this, 'ArtifactsBucketArn', {
      value: artifactsBucket.attrArn
    });
    new cdk.CfnOutput(this, 'OutputBucketArn', {
      value: outputBucket.attrArn
    });
  }
}
