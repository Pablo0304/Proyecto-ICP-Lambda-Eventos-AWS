import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './nested-lambda-stack';
import { S3Stack } from './nested-s3-stack';
import { SnsStack } from './nested-sns-stack';
import { SfnStack } from './nested-sfn-stack';

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const emailAddress = new cdk.CfnParameter(this, 'EmailAddress', {
      type: 'String',
      default: 'gonca.pablo@gmail.com'
    });

    const pipelineName = new cdk.CfnParameter(this, 'PipelineName', {
      type: 'String',
      default: 'alucloud85'
    });

    const templateBucketName = new cdk.CfnParameter(this, 'TemplateBucketName', {
      type: 'String',
      default: 'alucloud'
    });

    const templatePrefix = new cdk.CfnParameter(this, 'TemplatePrefix', {
      type: 'String',
      default: '85'
    });

    const startStateMachineRoleArn =
      'arn:aws:iam::974349055189:role/cursocloudaws-lambda-serverless-role';
    const workerLambdaRoleArn =
      'arn:aws:iam::974349055189:role/cursocloudaws-lambda-serverless-role';
    const stepFunctionsRoleArn =
      'arn:aws:iam::974349055189:role/cursocloudaws-events-workflows-states-role';

    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      pipelineName: pipelineName.valueAsString,
      codeBucketName: templateBucketName.valueAsString,
      codePrefix: templatePrefix.valueAsString,
      startStateMachineRoleArn,
      workerLambdaRoleArn
    });

    const s3Stack = new S3Stack(this, 'S3Stack', {
      pipelineName: pipelineName.valueAsString,
      startStateMachineLambdaArn: lambdaStack.startStateMachineLambdaArn
    });
    s3Stack.addDependency(lambdaStack);

    const snsStack = new SnsStack(this, 'SnsStack', {
      pipelineName: pipelineName.valueAsString,
      emailAddress: emailAddress.valueAsString
    });

    const sfnStack = new SfnStack(this, 'SfnStack', {
      pipelineName: pipelineName.valueAsString,
      stepFunctionsRoleArn,
      inspectObjectLambdaArn: lambdaStack.inspectObjectLambdaArn,
      prepareArtifactLambdaArn: lambdaStack.prepareArtifactLambdaArn,
      extremeCompressionLambdaArn: lambdaStack.extremeCompressionLambdaArn,
      storeFinalObjectLambdaArn: lambdaStack.storeFinalObjectLambdaArn,
      notifyUserLambdaArn: lambdaStack.notifyUserLambdaArn,
      artifactsBucketName: s3Stack.artifactsBucketName,
      outputBucketName: s3Stack.outputBucketName,
      snsTopicArn: snsStack.snsTopicArn
    });
    sfnStack.addDependency(lambdaStack);
    sfnStack.addDependency(snsStack);
    sfnStack.addDependency(s3Stack);

    new cdk.CfnOutput(this, 'InputBucketName', {
      value: s3Stack.inputBucketName
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: s3Stack.artifactsBucketName
    });

    new cdk.CfnOutput(this, 'OutputBucketName', {
      value: s3Stack.outputBucketName
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: sfnStack.stateMachineArn
    });

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: snsStack.snsTopicArn
    });

    new cdk.CfnOutput(this, 'StartStateMachineLambdaArn', {
      value: lambdaStack.startStateMachineLambdaArn
    });
  }
}
