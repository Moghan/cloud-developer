import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todoIdIndex = process.env.TODO_ID_INDEX) {
    }

    async getAllTodos(userId): Promise<TodoItem[]> {

        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            },
            ScanIndexForward: false
        }).promise()

        const items = result.Items
        return items as TodoItem[]
    }

    async getTodo(todoId): Promise<TodoItem> {

        const result = await this.docClient.query({
            TableName : this.todosTable,
            IndexName : this.todoIdIndex,
            KeyConditionExpression: "#todo = :v_todo",
            ExpressionAttributeNames:{
            "#todo": "id"
            },
            ExpressionAttributeValues: {
                ":v_todo": todoId
            }
        }).promise()

        if(!result.Items) {
            return undefined
        } // Reviewer: This look terrible. What shall I return if no item was found?

        return result.Items[0] as TodoItem
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
        TableName: this.todosTable,
        Item: todo
        }).promise()

        return todo
    }

    async updateTodo(todo: TodoItem, update: UpdateTodoRequest): Promise<UpdateTodoRequest> {
        const result = await this.docClient.update({
            TableName: this.todosTable,
            Key:{
                "userId": todo.userId,
                "createdAt": todo.createdAt
            },
            UpdateExpression: "set #name = :name, dueDate=:dueDate, done=:done",
            ExpressionAttributeNames:{
            "#name": "name"
            },
            ExpressionAttributeValues:{
                ":name":update.name,
                ":dueDate":update.dueDate,
                ":done":update.done
            },
            ReturnValues:"UPDATED_NEW"
        }).promise()
        
        console.log("updateTodo - result", result)

        // Reviewer: I am not how to check the update was succesful and what to return.
        return update
    }

    async deleteTodo(todo: TodoItem): Promise<TodoItem> {
        const result = await this.docClient.delete({
            TableName: this.todosTable,
            Key:{
                "userId": todo.userId,
                "createdAt": todo.createdAt
            }
        }).promise()

        // Rewiewer: Shouldn't I check the result in some way?
        console.log("deleteTodo result", result)

        return todo
    }
}

    

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
