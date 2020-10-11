import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserId } from '../auth/utils'
import * as uuid from 'uuid'

const todoAccess = new TodoAccess()
const bucket = process.env.IMAGES_S3_BUCKET

export async function getAllTodos(jwtToken: string): Promise<TodoItem[]> {
  const userId = parseUserId(jwtToken)

  return todoAccess.getAllTodos(userId)
}

export async function getTodo(todoId: string): Promise<TodoItem> {

  return todoAccess.getTodo(todoId)
}

export async function deleteTodo(todoItem: TodoItem): Promise<TodoItem> {

  return todoAccess.deleteTodo(todoItem)
}

export async function updateTodo(todoItem: TodoItem, update: UpdateTodoRequest): Promise<UpdateTodoRequest> {

  return todoAccess.updateTodo(todoItem, update)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> {

  const itemId = uuid.v4()
  const userId = parseUserId(jwtToken)

  return await todoAccess.createTodo({
    id: itemId,
    userId: userId,
    name: createTodoRequest.name,
    createdAt: new Date().toISOString(),
    dueDate: createTodoRequest.dueDate,
    done: false,
    attachmentUrl: `https://${bucket}.s3.eu-north-1.amazonaws.com/${itemId}`
  })
}