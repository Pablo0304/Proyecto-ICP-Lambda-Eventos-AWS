import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface LambdaStackProps extends cdk.NestedStackProps {
  pipelineName: string;
  codeBucketName: string;
  codePrefix: string;
  startStateMachineRoleArn: string;
  workerLambdaRoleArn: string;
}

export class LambdaStack extends cdk.NestedStack {
  public readonly startStateMachineLambdaArn: string;
  public readonly inspectObjectLambdaArn: string;
  public readonly prepareArtifactLambdaArn: string;
  public readonly extremeCompressionLambdaArn: string;
  public readonly storeFinalObjectLambdaArn: string;
  public readonly notifyUserLambdaArn: string;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const startStateMachine = new lambda.CfnFunction(this, 'StartStateMachine', {
      functionName: cdk.Fn.sub('${PipelineName}-StartStateMachine', {
        PipelineName: props.pipelineName
      }),
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: props.startStateMachineRoleArn,
      timeout: 30,
      memorySize: 256,
      tracingConfig: { mode: 'Active' },
      environment: {
        variables: {
          STATE_MACHINE_NAME: props.pipelineName
        }
      },
      code: {
        s3Bucket: props.codeBucketName,
        s3Key: cdk.Fn.sub('${CodePrefix}/lambdas/StartStateMachine/StartStateMachine.zip', {
          CodePrefix: props.codePrefix
        })
      }
    });

    const inspectObject = new lambda.CfnFunction(this, 'InspectObject', {
      functionName: cdk.Fn.sub('${PipelineName}-InspectObject', {
        PipelineName: props.pipelineName
      }),
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: props.workerLambdaRoleArn,
      timeout: 60,
      memorySize: 512,
      tracingConfig: { mode: 'Active' },
      code: {
        s3Bucket: props.codeBucketName,
        s3Key: cdk.Fn.sub('${CodePrefix}/lambdas/InspectObject/InspectObject.zip', {
          CodePrefix: props.codePrefix
        })
      }
    });

    const prepareArtifact = new lambda.CfnFunction(this, 'PrepareArtifact', {
      functionName: cdk.Fn.sub('${PipelineName}-PrepareArtifact', {
        PipelineName: props.pipelineName
      }),
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: props.workerLambdaRoleArn,
      timeout: 120,
      memorySize: 1024,
      tracingConfig: { mode: 'Active' },
      code: {
        s3Bucket: props.codeBucketName,
        s3Key: cdk.Fn.sub('${CodePrefix}/lambdas/PrepareArtifact/PrepareArtifact.zip', {
          CodePrefix: props.codePrefix
        })
      }
    });

    const extremeCompression = new lambda.CfnFunction(this, 'ExtremeCompression', {
      functionName: cdk.Fn.sub('${PipelineName}-ExtremeCompression', {
        PipelineName: props.pipelineName
      }),
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: props.workerLambdaRoleArn,
      timeout: 900,
      memorySize: 4096,
      tracingConfig: { mode: 'Active' },
      code: {
        s3Bucket: props.codeBucketName,
        s3Key: cdk.Fn.sub('${CodePrefix}/lambdas/ExtremeCompression/ExtremeCompression.zip', {
          CodePrefix: props.codePrefix
        })
      }
    });

    const storeFinalObject = new lambda.CfnFunction(this, 'StoreFinalObject', {
      functionName: cdk.Fn.sub('${PipelineName}-StoreFinalObject', {
        PipelineName: props.pipelineName
      }),
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: props.workerLambdaRoleArn,
      timeout: 120,
      memorySize: 1024,
      tracingConfig: { mode: 'Active' },
      code: {
        s3Bucket: props.codeBucketName,
        s3Key: cdk.Fn.sub('${CodePrefix}/lambdas/StoreFinalObject/StoreFinalObject.zip', {
          CodePrefix: props.codePrefix
        })
      }
    });

    const notifyUser = new lambda.CfnFunction(this, 'NotifyUser', {
      functionName: cdk.Fn.sub('${PipelineName}-NotifyUser', {
        PipelineName: props.pipelineName
      }),
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: props.workerLambdaRoleArn,
      timeout: 30,
      memorySize: 256,
      tracingConfig: { mode: 'Active' },
      code: {
        s3Bucket: props.codeBucketName,
        s3Key: cdk.Fn.sub('${CodePrefix}/lambdas/NotifyUser/NotifyUser.zip', {
          CodePrefix: props.codePrefix
        })
      }
    });

    this.startStateMachineLambdaArn = startStateMachine.attrArn;
    this.inspectObjectLambdaArn = inspectObject.attrArn;
    this.prepareArtifactLambdaArn = prepareArtifact.attrArn;
    this.extremeCompressionLambdaArn = extremeCompression.attrArn;
    this.storeFinalObjectLambdaArn = storeFinalObject.attrArn;
    this.notifyUserLambdaArn = notifyUser.attrArn;

    new cdk.CfnOutput(this, 'StartStateMachineLambdaArn', {
      value: this.startStateMachineLambdaArn
    });
    new cdk.CfnOutput(this, 'InspectObjectLambdaArn', {
      value: this.inspectObjectLambdaArn
    });
    new cdk.CfnOutput(this, 'PrepareArtifactLambdaArn', {
      value: this.prepareArtifactLambdaArn
    });
    new cdk.CfnOutput(this, 'ExtremeCompressionLambdaArn', {
      value: this.extremeCompressionLambdaArn
    });
    new cdk.CfnOutput(this, 'StoreFinalObjectLambdaArn', {
      value: this.storeFinalObjectLambdaArn
    });
    new cdk.CfnOutput(this, 'NotifyUserLambdaArn', {
      value: this.notifyUserLambdaArn
    });
  }
}
