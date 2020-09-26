/*import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  console.log("todoId", todoId)

  // TODO: Remove a TODO item by id
  return undefined
}
*/

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)
  const todoId = event.pathParameters.todoId

  const result = await docClient.get({
    TableName : todosTable,
    Key: {
      'id': todoId
    }
  }).promise()

  if (result.Item) {
    console.log("Item", result.Item)

    const dresult = await docClient.delete({
      TableName : todosTable,
      Key: {
        'id': todoId
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

/*
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)
  const todoId = event.pathParameters.todoId

  const result = await docClient.get({
    TableName : todosTable,
    Key: {
      HashKey: todoId
    }
  }).promise()

  if (result.Count !== 0 && result.Item) {
    console.log("Item", result.Item)

    const dresult = await docClient.delete({
      TableName : todosTable,
      Key: {
        HashKey: todoId
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
    body: 'Failed to delete the item'
  }
}
 */