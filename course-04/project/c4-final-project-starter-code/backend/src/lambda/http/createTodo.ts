import 'source-map-support/register'
import * as uuid from 'uuid'
import { parseUserId} from '../../auth/utils'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

const todosTable = process.env.GROUPS_TABLE

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

  await this.docClient.put({
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
      newTodo
    })
  }
}
