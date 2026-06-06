# GCP teardown checklist

After Fly.io is live and GitHub Pages curiosities work, remove Google Cloud resources to stop billing.

## Verify first

- [ ] `curl https://rick-morty-portal-api.fly.dev/health` returns `ok`
- [ ] GitHub Pages: open a character and episode detail page; AI curiosity card loads (no CORS errors in DevTools)
- [ ] GitHub secret `AI_API_URL` points to the Fly URL (not `*.run.app`)

## Delete GCP resources

1. **Cloud Run** — delete service `rick-morty-portal` (or your service name) in the console or:

   ```bash
   gcloud run services delete rick-morty-portal --region=YOUR_REGION
   ```

2. **Artifact Registry** — delete the Docker repository used for deploy images.

3. **Workload Identity Federation** — remove the pool/provider if it was only for this repo’s GitHub Actions.

4. **Service account** — delete or detach roles from the deploy service account if unused.

5. **Optional:** delete the entire GCP project if nothing else runs there.

## GitHub cleanup

Remove repository secrets that are no longer used:

- `GCP_REGION`
- `GCP_PROJECT_ID`
- `GCP_REGISTRY_NAME`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`
- `ALLOWED_ORIGINS` (if moved to Fly secrets only)
- `LLM_API_KEY` (if moved to Fly secrets only)

Keep:

- `FLY_API_TOKEN`
- `AI_API_URL` (Fly BFF URL for Pages build)

## GHCR (optional)

Old container images may remain under `ghcr.io/<owner>/rick-and-morty-portal`. Delete them in GitHub **Packages** if you no longer need rollback images.

## Billing

- Disable billing on the GCP project or set a $0 budget alert.
- Confirm no recurring charges in the GCP billing console after 24–48 hours.
