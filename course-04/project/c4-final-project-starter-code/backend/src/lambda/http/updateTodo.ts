import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import 'source-map-support/register'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { parseUserId} from '../../auth/utils'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

const todoIdIndex = process.env.TODO_ID_INDEX
const todosTable = process.env.TODOS_TABLE
const XAWS = AWSXRay.captureAWS(AWS)
const docClient: DocumentClient = createDynamoDBClient()

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  console.log("todoId", todoId)

  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  console.log("updatedTodo", updatedTodo)

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const userId = parseUserId(jwtToken)



  const result = await docClient.query({
    TableName : todosTable,
    IndexName : todoIdIndex,
    KeyConditionExpression: "#todo = :v_todo",
    ExpressionAttributeNames:{
      "#todo": "id"
    },
    ExpressionAttributeValues: {
        ":v_todo": todoId
    }
  }).promise()

  if (result.Items && result.Items[0].userId === userId) {
    const itemToUpdate = result.Items[0]

    const dresult = await docClient.update({
      TableName: todosTable,
      Key:{
          "userId": itemToUpdate.userId,
          "createdAt": itemToUpdate.createdAt
      },
      UpdateExpression: "set #name = :name, dueDate=:dueDate, done=:done",
      ExpressionAttributeNames:{
        "#name": "name"
      },
      ExpressionAttributeValues:{
          ":name":updatedTodo.name,
          ":dueDate":updatedTodo.dueDate,
          ":done":updatedTodo.done
      },
      ReturnValues:"UPDATED_NEW"
    }).promise()

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(dresult)
    }
  }

  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: 'Failed to update. Item not found or user do not own item.'
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