# Proyecto ICP Lambda Eventos AWS

Este repositorio contiene **dos versiones equivalentes** del mismo pipeline de compresión en AWS:

- `CloudFormation/`: plantilla CFN original con stacks anidados.
- `CDK/`: réplica en AWS CDK (TypeScript) usando **L1 (Cfn\*)**.

## ¿Qué hace el proyecto?

Cuando subes un archivo al bucket de entrada, se dispara una Lambda que inicia una Step Function.  
La Step Function inspecciona el objeto, lo copia a un bucket de artefactos (para usar buenas prácticas en la transmisión de objetos entre Lambdas), lo comprime con gzip, lo guarda en el bucket de salida y finalmente envía una notificación por email vía SNS.

## Estructura

- `CloudFormation/main-stack.json`: orquesta los stacks (Lambda, S3, SNS y SFN).
- `CloudFormation/lambda-stack.json`: Lambdas por ZIP en S3.
- `CloudFormation/s3-stack.json`: buckets `input`, `artifacts`, `output`.
- `CloudFormation/sns-stack.json`: topic y suscripción email.
- `CloudFormation/sfn-stack.json`: definición de la Step Function.
- `CDK/`: misma infraestructura en CDK (TypeScript, L1).

## Scripts útiles

- `cleanup-stack.sh`: vacía los 3 buckets y borra el stack CFN.
- `create-stack.sh`: crea el stack CFN usando el template en S3.

### Ejemplos

```bash
./cleanup-stack.sh
```

```bash
./create-stack.sh
```

## Parámetros por defecto (CFN)

- `EmailAddress`: `gonca.pablo@gmail.com`
- `PipelineName`: `alucloud85`
- `TemplateBucketName`: `alucloud`
- `TemplatePrefix`: `85`

## Requisitos importantes

- Los ZIPs de las Lambdas deben estar en:
  - `s3://alucloud/85/lambdas/<LambdaName>/<LambdaName>.zip`
- Los roles IAM deben existir con estos ARN:
  - `arn:aws:iam::974349055189:role/cursocloudaws-lambda-serverless-role`
  - `arn:aws:iam::974349055189:role/cursocloudaws-events-workflows-states-role`

## ¿Cómo se prueba?

1. Despliega el stack.
2. Acepta la suscripción al topic de SNS.
3. Sube un archivo al bucket `alucloud85-input`.
4. Espera el email y revisa el objeto comprimido en `alucloud85-output`.
