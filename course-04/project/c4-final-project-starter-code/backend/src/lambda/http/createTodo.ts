import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import 'source-map-support/register'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as uuid from 'uuid'
import { parseUserId} from '../../auth/utils'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

const todosTable = process.env.TODOS_TABLE
const XAWS = AWSXRay.captureAWS(AWS)
const docClient: DocumentClient = createDynamoDBClient()

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodoRequest: CreateTodoRequest = JSON.parse(event.body)
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const itemId = uuid.v4()
  const userId = parseUserId(jwtToken)
  const newTodo = {
    id: itemId,
    userId: userId,
    name: newTodoRequest.name,
    dueDate: newTodoRequest.dueDate,
    timestamp: new Date().toISOString()
  }

  await docClient.put({
    TableName: todosTable,
    Item: newTodo
  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: newTodo
    })
  }
}

function createDynamoDBClient() { // duplication of code that I might fix another day
  if (false && process.env.IS_OFFLINE) { // turned off for now
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}