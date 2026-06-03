import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "@types/aws-lambda";

// ---------------------------------------------------------------------------
// DynamoDB client (shared across warm invocations)
// ---------------------------------------------------------------------------

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME ?? "panel-io-configurations";

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

/**
 * Builds a JSON-serialised API Gateway response.
 *
 * @param statusCode - HTTP status code.
 * @param body       - Value to JSON-stringify as the response body.
 */
function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

/** Returns a 400 Bad Request response. */
function badRequest(message: string): APIGatewayProxyResultV2 {
  return jsonResponse(400, { error: message });
}

/** Returns a 404 Not Found response. */
function notFound(id: string): APIGatewayProxyResultV2 {
  return jsonResponse(404, { error: `Configuration '${id}' not found.` });
}

/** Returns a 500 Internal Server Error response. */
function internalError(err: unknown): APIGatewayProxyResultV2 {
  const message = err instanceof Error ? err.message : "Unknown error";
  return jsonResponse(500, { error: message });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * POST /configurations
 *
 * Expects a full `Configuration` object as JSON. Writes it to DynamoDB with
 * `updatedAt` stamped to now. Returns 201 Created on success.
 */
async function handleSave(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (!event.body) {
    return badRequest("Request body is required.");
  }

  let item: Record<string, unknown>;
  try {
    item = JSON.parse(event.body) as Record<string, unknown>;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (typeof item["id"] !== "string" || !item["id"]) {
    return badRequest("Configuration must have a non-empty string 'id'.");
  }

  item["updatedAt"] = new Date().toISOString();

  await dynamo.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
    }),
  );

  return jsonResponse(201, { id: item["id"] });
}

/**
 * GET /configurations/:id
 *
 * Fetches a single configuration by its `id` primary key.
 * Returns 200 with the item or 404 if not found.
 */
async function handleLoad(id: string): Promise<APIGatewayProxyResultV2> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLE,
      Key: { id },
    }),
  );

  if (!result.Item) {
    return notFound(id);
  }

  return jsonResponse(200, result.Item);
}

/**
 * GET /configurations
 *
 * Scans all configurations and returns an array of `{ id, name, updatedAt }`
 * summaries, sorted most-recently-updated first.
 */
async function handleList(): Promise<APIGatewayProxyResultV2> {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: TABLE,
      ProjectionExpression: "id, #n, updatedAt",
      // "name" is a DynamoDB reserved word — use an alias
      ExpressionAttributeNames: { "#n": "name" },
    }),
  );

  const summaries = (result.Items ?? []).sort((a, b) =>
    String(b["updatedAt"]).localeCompare(String(a["updatedAt"])),
  );

  return jsonResponse(200, summaries);
}

/**
 * DELETE /configurations/:id
 *
 * Deletes the configuration with the given ID.
 * Returns 200 on success (DynamoDB delete is idempotent, so no 404 branch).
 */
async function handleDelete(id: string): Promise<APIGatewayProxyResultV2> {
  await dynamo.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { id },
    }),
  );

  return jsonResponse(200, { deleted: id });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

/**
 * AWS Lambda entry point.
 *
 * Routes `method + rawPath` to the appropriate CRUD operation:
 *
 * | Method | Path                      | Action |
 * |--------|---------------------------|--------|
 * | POST   | /configurations           | save   |
 * | GET    | /configurations/:id       | load   |
 * | GET    | /configurations           | list   |
 * | DELETE | /configurations/:id       | delete |
 *
 * The `TABLE_NAME` environment variable sets the DynamoDB table.
 * Returns standard API Gateway V2 proxy response objects.
 *
 * @param event - API Gateway HTTP API v2 proxy event.
 */
export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method.toUpperCase();
  const rawPath = event.rawPath ?? "";

  // Strip stage prefix if present (e.g. "/prod/configurations/abc" → "/configurations/abc")
  const path = rawPath.replace(/^\/[^/]+(?=\/configurations)/, "");

  const collectionPath = /^\/configurations\/?$/.test(path);
  const itemMatch = path.match(/^\/configurations\/(.+)$/);

  try {
    if (method === "POST" && collectionPath) {
      return await handleSave(event);
    }

    if (method === "GET" && itemMatch) {
      return await handleLoad(decodeURIComponent(itemMatch[1]));
    }

    if (method === "GET" && collectionPath) {
      return await handleList();
    }

    if (method === "DELETE" && itemMatch) {
      return await handleDelete(decodeURIComponent(itemMatch[1]));
    }

    return jsonResponse(404, { error: `No route for ${method} ${path}` });
  } catch (err) {
    return internalError(err);
  }
}
