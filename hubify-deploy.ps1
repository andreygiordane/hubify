
# Hubify - Script de Configuração para Produção e Deploy (GCP)

$BackendURL = "https://hubify-backend-358184322842.us-central1.run.app/api"
$SocketURL = "https://hubify-video-server-358184322842.us-central1.run.app"
$FrontendURL = "https://hubify-frontend-358184322842.us-central1.run.app"
$ProjectID = "hubify2"
$Region = "us-central1"
$SQLInstance = "hubify2:us-central1:hubify2-postgres" # Ajuste conforme sua instância Cloud SQL

Write-Host "[*] Preparando deploy para o projeto $ProjectID na região $Region" -ForegroundColor Cyan

# Observação: o script NÃO altera código fonte; usamos variáveis de build/runtime para configurar as URLs.

Write-Host "[1/3] Deploying video-server to Cloud Run..." -ForegroundColor Green
cd video-server
gcloud run deploy hubify-video-server `
    --source . `
    --region $Region `
    --project $ProjectID `
    --allow-unauthenticated `
    --max-instances 1 `
    --set-env-vars "BACKEND_URL=$BackendURL"
cd ..

Write-Host "[2/3] Deploying backend to Cloud Run (Cloud SQL optional)..." -ForegroundColor Green
cd backend
gcloud run deploy hubify-backend `
    --source . `
    --region $Region `
    --project $ProjectID `
    --allow-unauthenticated `
    --add-cloudsql-instances $SQLInstance `
    --set-env-vars "DATABASE_URL=jdbc:postgresql:///hubify?cloudSqlInstance=$SQLInstance&socketFactory=com.google.cloud.sql.postgres.SocketFactory,DB_USERNAME=hubify,DB_PASSWORD=951405An@,ALLOWED_ORIGINS=$FrontendURL"
cd ..

Write-Host "[3/3] Deploying frontend to Cloud Run (build-time envs)..." -ForegroundColor Green
cd frontend
gcloud run deploy hubify-frontend `
    --source . `
    --region $Region `
    --project $ProjectID `
    --allow-unauthenticated `
    --set-build-env-vars "VITE_API_URL=$BackendURL,VITE_SOCKET_URL=$SocketURL"
cd ..

Write-Host "[SUCCESS] Deploy commands executed. Verifique os logs do Cloud Build/Cloud Run para status." -ForegroundColor Yellow
