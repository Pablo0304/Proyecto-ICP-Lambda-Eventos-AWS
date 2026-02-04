import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';

interface SnsStackProps extends cdk.NestedStackProps {
  pipelineName: string;
  emailAddress: string;
}

export class SnsStack extends cdk.NestedStack {
  public readonly snsTopicArn: string;

  constructor(scope: Construct, id: string, props: SnsStackProps) {
    super(scope, id, props);

    const topic = new sns.CfnTopic(this, 'CompressionTopic', {
      topicName: cdk.Fn.sub('NotifyMe_${PipelineName}', {
        PipelineName: props.pipelineName
      })
    });

    new sns.CfnSubscription(this, 'EmailSubscription', {
      protocol: 'email',
      endpoint: props.emailAddress,
      topicArn: topic.ref
    });

    this.snsTopicArn = topic.ref;

    new cdk.CfnOutput(this, 'SnsTopicArn', { value: this.snsTopicArn });
  }
}
