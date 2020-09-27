import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import 'source-map-support/register'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { parseUserId} from '../../auth/utils'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

const todosTable = process.env.TODOS_TABLE
const XAWS = AWSXRay.captureAWS(AWS)

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Get all TODO items for a current user
  console.log('Processing event: ', event)

  const docClient: DocumentClient = createDynamoDBClient()

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const userId = parseUserId(jwtToken)
  console.log("userId", userId)

  const result = await docClient.query({
    TableName: todosTable,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
        ":userId": userId
    },
    ScanIndexForward: false
  }).promise()

  const items = result.Items
  console.log("items", items)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items
    })
  }
}

function createDynamoDBClient() {
  if (false && process.env.IS_OFFLINE) { // turned off for now
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}