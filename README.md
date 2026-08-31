# SIS - API Explorer

Explorador dinámico de las APIs SIS configuradas en el entorno. Incluye Traductor SIS y Reglamento
SIS, con el mismo flujo de autenticación y acceso a APIM utilizado por `APP-SIS-Reglamentos-React`.

La aplicación maneja dos identidades independientes:

- MSAL autentica a la persona que usa la SPA mediante redirección a Microsoft Entra ID.
- Una Azure Function obtiene el token de aplicación para APIM con `client_credentials`.

El navegador nunca envía ni recibe el `client secret`. Solo recibe el access token emitido para
la API seleccionada y lo conserva en memoria.

## Flujo de ejecución

1. El bootstrap valida las variables públicas e inicializa `PublicClientApplication`.
2. `MsalProvider` y `AuthGuard` restauran una cuenta en caché o inician `loginRedirect`.
3. Al autenticar al usuario, se solicita el token de APIM desde `POST /api/tokenApi` indicando la
   API activa.
4. La Azure Function usa las credenciales de aplicación de esa API, almacenadas en el servidor, para solicitar
   el token a Microsoft Entra ID.
5. El interceptor Axios agrega `Authorization: Bearer <token>` a cada llamada funcional hacia APIM.
6. El token se comparte entre solicitudes concurrentes y se renueva 60 segundos antes de expirar.
7. Ante un `401`, se fuerza una renovación y la solicitud se reintenta una sola vez.
8. Un segundo `401` se propaga como error controlado.

El documento OpenAPI se consulta con un cliente público separado. Las operaciones de negocio usan
exclusivamente la URL de APIM.

## Variables de entorno

Variables públicas incorporadas a la SPA:

```dotenv
VITE_AZURE_AD_INSTANCE=https://login.microsoftonline.com
VITE_AZURE_AD_CLIENT_ID=
VITE_AZURE_AD_TENANT_ID=
VITE_SIS_TRADUCTOR_BASE_URL=https://apim-sis-002-dev.uai.cl/traductor-sis
VITE_SIS_TRADUCTOR_OPENAPI_URL=https://app-dev-traductorsis-api-bmf4avaqgyhyf2g0.eastus2-01.azurewebsites.net/swagger/v1/swagger.json
VITE_API_BASE_URL_REGLAMENTO=https://apim-sis-002-dev.uai.cl/reglamentoapi
VITE_API_OPENAPI_URL_REGLAMENTO=https://app-dev-sis-serviciosreglamento-avfjejeubea3fkf8.eastus2-01.azurewebsites.net/swagger/v1/swagger.json
```

Variables privadas de la Azure Function y del proxy local de Vite:

```dotenv
AZURE_AD_TENANT_ID=
SIS_TRADUCTOR_SCOPE=
SIS_TRADUCTOR_CLIENT_ID=
SIS_TRADUCTOR_CLIENT_SECRET=
REGLAMENTOS_SCOPE=api://312446b6-e2d5-406e-8eac-5f83463e30f9/.default
REGLAMENTOS_CLIENT_ID=2816c029-725f-405d-84d7-8b77ebaed2e0
REGLAMENTOS_CLIENT_SECRET=
```

Las variables privadas no deben usar el prefijo `VITE_`. En Azure Static Web Apps deben configurarse
como application settings de la API administrada. El archivo `.env.example` contiene el contrato
completo sin valores sensibles.

## Desarrollo local

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

El middleware de Vite publica localmente `POST /api/tokenApi` con el mismo contrato que la Azure
Function desplegada. El selector del banner cambia la URL base, el OpenAPI y el token utilizado; la
aplicación queda disponible en `http://localhost:5173`.

La Function también puede compilarse de forma independiente:

```powershell
Set-Location api
npm install
npm run build
```

Para ejecutarla directamente se requiere Azure Functions Core Tools y un `local.settings.json`
local, excluido de control de versiones.

## Arquitectura

```text
api/
├── index.ts                         # Function client_credentials según la API seleccionada
├── host.json
├── package.json
└── tsconfig.json
src/
├── api/
│   └── transport.ts                 # Frontera HTTP del dominio Swagger
├── auth/
│   ├── AuthGuard.tsx                # Sesión interactiva MSAL
│   ├── msalConfig.ts
│   └── msalInstance.ts
├── config/
│   └── env.ts                       # Validación de configuración pública
├── services/
│   ├── api/
│   │   └── axios.config.ts          # Cliente APIM e interceptores
│   └── auth/
│       ├── token.constants.ts
│       ├── token.service.ts         # Caché, renovación y normalización
│       ├── token.storage.ts
│       └── token.types.ts
└── features/swagger/                # Funcionalidad de negocio sin credenciales
```

## Seguridad y errores

- MSAL usa `sessionStorage`, igual que el proyecto de referencia.
- El token de APIM vive solo en memoria.
- El `client secret` existe únicamente en el proceso servidor.
- Vite limita explícitamente las variables que puede exponer al navegador.
- Las respuestas y requests mostradas en el explorador se redactan antes de llegar a la interfaz.
- Los errores de token se transforman en mensajes controlados sin valores sensibles.
- Los timeouts, fallos de red, respuestas inválidas y estados `400`, `401`, `403`, `404` y `5xx`
  mantienen tratamientos diferenciados.

## Comandos

```powershell
npm run dev
npm run build
npm run preview
npm run lint
npm run format
npm run format:check
npm run test
```
