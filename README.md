# Proyecto ICP Lambda Eventos AWS

Este repositorio contiene **dos versiones equivalentes** del mismo pipeline de compresión en AWS:

- `CloudFormation/`: plantilla CFN original con stacks anidados.
- `CDK/`: réplica en AWS CDK (TypeScript) usando **L1 (Cfn\*)**.

## ¿Qué hace el proyecto?

Cuando subes un archivo al bucket de entrada, se dispara una Lambda que inicia una Step Function.  
La Step Function orquesta estas fases:

1. Inspección del objeto.
2. Copia al bucket de artefactos.
3. Compresión (gzip).
4. Copia del comprimido al bucket de salida.
5. Notificación por email vía SNS.

## Estructura

- `CloudFormation/main-stack.json`: orquesta los stacks (Lambda, S3, SNS y SFN).
- `CloudFormation/lambda-stack.json`: Lambdas por ZIP en S3.
- `CloudFormation/s3-stack.json`: buckets `input`, `artifacts`, `output`.
- `CloudFormation/sns-stack.json`: topic y suscripción email.
- `CloudFormation/sfn-stack.json`: definición de la Step Function.
- `CloudFormation/lambdas/`: ZIPs locales de las Lambdas.
- `CDK/`: misma infraestructura en CDK (TypeScript, L1).

## Arquitectura y datos en S3

- `*-input`: ingestión.
- `*-artifacts`: intermedio de trabajo.
- `*-output`: resultado final.
- El output tiene política de ciclo de vida con transición a `STANDARD_IA` (30 días), `GLACIER` (90 días) y `DEEP_ARCHIVE` (180 días).
- Los buckets están cifrados con SSE-S3 y bloquean acceso público.

## Lambdas

- `StartStateMachine`: se dispara con `s3:ObjectCreated:*` en el bucket de input e inicia la Step Function.
- `InspectObject`: lee metadatos del objeto.
- `PrepareArtifact`: copia al bucket de artefactos.
- `ExtremeCompression`: descarga, comprime y sube el `.gz`.
- `StoreFinalObject`: copia al bucket de salida.
- `NotifyUser`: publica en SNS.

## Scripts útiles

- `create-stack.sh`: crea el stack CFN usando el template en S3.
- `cleanup-stack.sh`: vacía los 3 buckets y borra el stack CFN.

Ejemplos:

```bash
./create-stack.sh
```

```bash
./cleanup-stack.sh
```

## Parámetros por defecto (CFN)

- `EmailAddress`: `gonca.pablo@gmail.com`
- `PipelineName`: `alucloud85`
- `TemplateBucketName`: `alucloud`
- `TemplatePrefix`: `85`

## Requisitos importantes

- AWS CLI configurado y accesible con el perfil `default`.
- Los ZIPs de las Lambdas deben estar subidos en `s3://<TemplateBucketName>/<TemplatePrefix>/lambdas/<LambdaName>/<LambdaName>.zip`.
- Los templates de CloudFormation también deben estar en el mismo bucket/prefijo: `main-stack.json`, `lambda-stack.json`, `s3-stack.json`, `sns-stack.json`, `sfn-stack.json`.
- Los roles IAM deben existir con estos ARN: `arn:aws:iam::974349055189:role/cursocloudaws-lambda-serverless-role` y `arn:aws:iam::974349055189:role/cursocloudaws-events-workflows-states-role`.

## Notas

- La compresión es más efectiva en ficheros con alta redundancia (por ejemplo, `.txt` y `.csv`) que en formatos ya comprimidos (por ejemplo, imágenes).
- Si cambias `TemplateBucketName`, `TemplatePrefix`, `PipelineName` o el nombre del stack, actualiza `create-stack.sh` y `cleanup-stack.sh` en consecuencia.

## Nota sobre CDK

La versión CDK replica la infraestructura usando constructos L1 (`Cfn*`) y referencias a ZIPs en S3.  
En la memoria del proyecto se indica que **la versión CDK no se pudo validar en ejecución** por restricciones de permisos de despliegue, mientras que la versión CloudFormation sí fue desplegada y probada.

## ¿Cómo se prueba?

1. Despliega el stack con `./create-stack.sh`.
2. Acepta la suscripción al topic de SNS en tu correo.
3. Sube un archivo al bucket `alucloud85-input`.
4. Revisa el `.gz` en `alucloud85-output` y el email de notificación.
