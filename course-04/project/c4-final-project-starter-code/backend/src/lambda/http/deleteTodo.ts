import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE
const todoIdIndex = process.env.TODO_ID_INDEX


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

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

  if (result.Items) {
    const itemToDelete = result.Items[0]

    const dresult = await docClient.delete({
      TableName: todosTable,
      Key:{
          "userId": itemToDelete.userId,
          "createdAt": itemToDelete.createdAt
      }
    }).promise()

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(dresult.Item)
    }
  }

  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: 'Failed to delete. Item not found.'
  }
}