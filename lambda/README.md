# Panel I/O Config Lambda

This is the AWS Lambda function that runs the backend for the EMIT Panel I/O
Configurator. It saves and loads panel configurations in a DynamoDB table.

## What it does

The function handles four actions:

| Method | URL                      | What happens           |
|--------|--------------------------|------------------------|
| POST   | /configurations          | Save a configuration   |
| GET    | /configurations/:id      | Load one configuration |
| GET    | /configurations          | List all configurations|
| DELETE | /configurations/:id      | Delete a configuration |

It sends and receives JSON. IDs go in the URL path.

## Setup

You need an AWS account and a DynamoDB table with `id` (String) as the partition
key. The function reads the table name from an environment variable:

| Variable     | Required | Example                     |
|--------------|----------|-----------------------------|
| `TABLE_NAME` | Yes      | `panel-io-configurations`   |

## Build

Install the dependencies and compile:

```sh
npm install
npm run build
```

This puts the compiled files in the `dist/` folder.

## Deploy

**Option 1 — Zip and upload**

1. Run the build steps above.
2. Zip the `dist/` folder and your `node_modules/`.
3. Upload the zip to an AWS Lambda function in the AWS console.
4. Set the handler to `handler.handler`.
5. Set the `TABLE_NAME` environment variable.

**Option 2 — AWS SAM or CDK**

Point your SAM template or CDK stack at this folder. Set `Handler` to
`dist/handler.handler` and pass `TABLE_NAME` as an environment variable.

Make sure the Lambda execution role has `dynamodb:GetItem`, `dynamodb:PutItem`,
`dynamodb:DeleteItem`, and `dynamodb:Scan` on your table.
