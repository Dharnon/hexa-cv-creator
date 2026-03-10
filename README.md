# Mini server SAP y despliegue

## Desarrollo local

1. Instala dependencias del frontend con `npm install`.
2. Instala dependencias del backend con `cd server && npm install`.
3. Copia `server/.env.example` a `server/.env` y rellena las credenciales SAP.
4. Arranca todo con `npm run dev`.

El frontend consume el backend local mediante `/sap-api`, resuelto por proxy en Vite.

## Docker Compose en VM

1. Instala Docker, Compose plugin y Git en la VM:
   - `sudo apt update && sudo apt install -y docker.io docker-compose-plugin git`
2. Clona el repo en la VM y entra al proyecto:
   - `git clone <URL_DEL_REPO> && cd hexa-cv-creator`
3. Crea el archivo de secretos persistente:
   - `sudo mkdir -p /etc/hexa`
   - `sudo cp deploy/sap-api.env.example /etc/hexa/sap-api.env`
   - `sudo nano /etc/hexa/sap-api.env`
4. Copia ese env al workspace para el primer despliegue manual:
   - `cp /etc/hexa/sap-api.env server/.env.production`
5. Ejecuta:
   - `docker compose up -d --build`
6. Verifica:
   - `curl http://127.0.0.1/sap-api/health`

## CI/CD con runner self-hosted

- Instala un runner self-hosted de GitHub Actions en la VM.
- Asegurate de que el runner tenga Docker y Docker Compose disponibles.
- Mantén los secretos en `/etc/hexa/sap-api.env`.
- Cada push a `main` ejecuta `.github/workflows/deploy-vm.yml` y redepliega los contenedores.
