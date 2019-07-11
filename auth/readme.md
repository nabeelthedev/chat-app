## Description
A CloudFormation template for authentication resources.

## Requirements
1. IAM role with appropriate permissions (i.e. Lambda, Cognito).
2. S3 bucket to upload Lambda functions.

## Install
1. ```aws cloudformation package --template-file ./template.json --s3-bucket your-bucket --output-template-file packaged-template.json --use-json ```
2. ```aws cloudformation create-stack --template-body file://packaged-template.json --stack-name stack-name --parameters ParameterKey=UserPoolDomainName,ParameterValue=domain-name ParameterKey=ServiceRoleArn,ParameterValue='your-service-role-arn' ParameterKey=IdPGoogleId,ParameterValue=your-google-id ParameterKey=IdPGoogleSecret,ParameterValue=your-google-secret ```

Fill in parameters above with your information (i.e. *your-bucket*, *your-service-role-arn*).