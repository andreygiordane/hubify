Prerequisites

- Install Google Cloud SDK and authenticate: `gcloud auth login` and `gcloud config set project hubify2`.
- Enable required APIs: Cloud Run, Cloud Build, Cloud SQL Admin, Artifact Registry (if needed).
- Ensure you have a Cloud SQL instance: `hubify2:us-central1:hubify2-postgres` or update `hubify-deploy.ps1`.
- Ensure your local `gcloud` user has permissions to deploy to the project.

Steps

1. Review environment values in `hubify-deploy.ps1` (Backend/Socket/Frontend URLs, Project ID, Region, Cloud SQL instance).
2. From repository root, run PowerShell (Windows):

```powershell
# Make sure project is set
gcloud config set project hubify2
# Then run the provided deploy script
.\\hubify-deploy.ps1
```

What the script does

- Deploys `video-server` to Cloud Run and sets `BACKEND_URL` runtime env.
- Deploys `backend` to Cloud Run, attaches Cloud SQL instance and sets DB and allowed origin envs.
- Deploys `frontend` to Cloud Run and sets build-time env variables `VITE_API_URL` and `VITE_SOCKET_URL` so the built static site points to backend and socket services.

Notes & troubleshooting

- The frontend build uses `VITE_*` build-time env vars. If you rebuild locally, export these before `npm run build` or rely on Cloud Run build envs.
- If you prefer Container Image deployments, build images and use `gcloud run deploy --image ...` instead.
- Check Cloud Build logs in the GCP Console if a build fails.

Next steps I can do for you

- Run a dry-run checklist and validate all config values.
- Prepare a `cloudbuild.yaml` to build images and deploy via Cloud Build.
- Help you run the script step-by-step and interpret Cloud Build logs.
