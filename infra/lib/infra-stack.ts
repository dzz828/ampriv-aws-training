import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as iam from '@aws-cdk/aws-iam';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { CfnApp, CfnBranch, CustomRule, RedirectStatus } from '@aws-cdk/aws-amplify';
import { KeyPair } from 'cdk-ec2-key-pair';
import { ApplicationLoadBalancer, ApplicationProtocol } from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceTarget } from "@aws-cdk/aws-elasticloadbalancingv2-targets";
import { EndpointType } from "@aws-cdk/aws-apigateway";

import { Proxy } from "./proxy";
import * as fs from 'fs';
import * as path from 'path';
import { UserData } from '@aws-cdk/aws-ec2';

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'Customer', {
      tableName: 'Customer',
      partitionKey: { name: 'CustomerID', type: dynamodb.AttributeType.STRING },      
    });

    const backendEc2AccessKey = new KeyPair(this, 'aws-training-backend-ec2-key', {
      name: 'aws-training-backend-ec2-key',
    });
    backendEc2AccessKey.grantReadOnPublicKey;

    const backendVpc = new ec2.Vpc(this, 'aws-training-backend-vpc', {
      natGateways: 0,
      subnetConfiguration: [{
        cidrMask: 24,
        name: "aws-training-backend-vpc",
        subnetType: ec2.SubnetType.PUBLIC
      }]
    });

    const backendLBSecurityGroup = new ec2.SecurityGroup(this, 'aws-training-backend-lb-sg', {
      vpc: backendVpc,
      securityGroupName: 'aws-training-backend-lb-sg',
      allowAllOutbound: true
    });
    backendLBSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow http default prot');


    const backendEc2SecurityGroup = new ec2.SecurityGroup(this, 'aws-training-backend-ec2-sg', {
      vpc: backendVpc,
      securityGroupName: 'aws-training-backend-ec2-sg',
      allowAllOutbound: true
    });
    backendEc2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH Access');
    backendEc2SecurityGroup.addIngressRule(backendEc2SecurityGroup, ec2.Port.allTraffic(), 'Allow same SG access')
    backendEc2SecurityGroup.addIngressRule(backendLBSecurityGroup, ec2.Port.allTraffic(), 'Allow LB SG access')

    const backendEc2Role = new iam.Role(this, 'aws-training-backend-ec2-role', {
      roleName: 'aws-training-backend-ec2-role',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    })
    backendEc2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'));
    backendEc2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    backendEc2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    backendEc2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'));
    backendEc2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDbFullAccess'));

    const ec2Ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64
    });

    const backendEc2UserDataText = fs.readFileSync(path.join(__dirname, '../src/aws-training-ec2-user-data.sh')).toString("utf8");

    const backendEc2Instance = new ec2.Instance(this, 'Instance', {
      instanceName: 'aws-training-backend-ec2',
      vpc: backendVpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2Ami,
      securityGroup: backendEc2SecurityGroup,
      keyName: backendEc2AccessKey.keyPairName,
      role: backendEc2Role,
      userData: UserData.custom(backendEc2UserDataText)
    });
    
    const backendLB = new ApplicationLoadBalancer(this, 'aws-training-backend-lb', {
      vpc: backendVpc,
      securityGroup: backendLBSecurityGroup,
      internetFacing: true
    });

    const backendLBListener = backendLB.addListener('aws-training-backend-lb-listener', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
    });

    backendLBListener.addTargets("aws-training-backend-lb-target", {
      healthCheck: {
        enabled: true,
        path: "/account/all",
      },
      port: 8080,
      targets: [new InstanceTarget(backendEc2Instance)],
    });

    backendLBListener.connections.allowDefaultPortFromAnyIpv4();

    const backendApiGateway = new Proxy(this, "aws-training-backend-apigw", {
      apiName: "aws-training-backend-apigw", endpointType: EndpointType.REGIONAL
    });

    const backendApiGatewayProxyPath = "backend";
    backendApiGateway.addProxy(backendApiGatewayProxyPath, `http://${backendLB.loadBalancerDnsName}`, 'ANY');

    const frontendAmplifyApp = new CfnApp(this, 'aws-training-frontend', {
      name: 'aws-training-frontend',
      repository: 'https://github.com/xxxx.git',
      oauthToken: 'xxxx',
      buildSpec: `
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm install
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: build
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
    appRoot: frontend      
      `,
      environmentVariables: [
        {
          name: 'AMPLIFY_MONOREPO_APP_ROOT',
          value: 'frontend'
        },
        {
          name: 'AMPLIFY_DIFF_DEPLOY',
          value: 'false'
        },
      ],
      customRules:[
        new CustomRule({
          source: '/api/<*>',
          target: `${backendApiGateway.getUrl()}${backendApiGatewayProxyPath}/<*>`,
          status: RedirectStatus.REWRITE,
        }),
        CustomRule.SINGLE_PAGE_APPLICATION_REDIRECT,
      ]
    });

    const frontendReleaseBranch = new CfnBranch(this, 'MainBranch', {
      appId: frontendAmplifyApp.attrAppId,
      branchName: 'main',
      enableAutoBuild: true,
    });

    new cdk.CfnOutput(this, 'DynamoDB Arn', { value: table.tableArn });
    new cdk.CfnOutput(this, 'Frontend Amplify Domain', { value: frontendReleaseBranch.branchName + '.' + frontendAmplifyApp.attrDefaultDomain });
    new cdk.CfnOutput(this, 'Backend API Gateway Path', { value: backendApiGateway.getUrl() });
    new cdk.CfnOutput(this, 'Backend Load Balancer Domain', { value: backendLB.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'Backend EC2 IP Address', { value: backendEc2Instance.instancePublicIp });
    new cdk.CfnOutput(this, 'Backend EC2 Key Name', { value: backendEc2AccessKey.keyPairName })
    new cdk.CfnOutput(this, 'Backend Download EC2 Access Key Command', { value: 'rm -f cdk-key.pem & aws secretsmanager get-secret-value --secret-id ec2-ssh-key/' + backendEc2AccessKey.keyPairName + '/private --query SecretString --output text > cdk-key.pem && chmod 400 cdk-key.pem' })
    new cdk.CfnOutput(this, 'Backend EC2 ssh command', { value: 'ssh -i cdk-key.pem -o IdentitiesOnly=yes ec2-user@' + backendEc2Instance.instancePublicIp })
  }
}
