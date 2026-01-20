import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const dynamoConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Use local DynamoDB endpoint for development
if (process.env.DYNAMODB_ENDPOINT) {
  dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  dynamoConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  };
}

const client = new DynamoDBClient(dynamoConfig);

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export function getDynamoClient() {
  return docClient;
}
