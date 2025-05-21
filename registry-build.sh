#!/bin/bash

# Define the target image tag
IMAGE_TAG="us-west1-docker.pkg.dev/esim-a3042/cloud-run-source-deploy/idx-esim-backend-09657482:latest"
SERVICE_NAME="idx-esim-backend-09657482"
REGION="us-west1"
PORT="8080"
ENV_FILE=".env"

# Flag to control building the image
BUILD_IMAGE=false

# Parse command-line arguments
for arg in "$@"
do
  case $arg in
    --build)
    BUILD_IMAGE=true
    shift # Remove --build from processing
    ;;
    *)
    # Ignore other arguments for now or add more cases later
    ;;
  esac
done

# Conditionally build and push the container image
if [ "$BUILD_IMAGE" = true ]; then
  echo "Building and pushing container image..."
  gcloud builds submit --tag "${IMAGE_TAG}"
else
  echo "Skipping container image build (use --build flag to enable)."
fi

# --- Logic to read .env and format variables ---
ENV_VARS=""

echo "Reading environment variables from $ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  # Trim leading/trailing whitespace
  line=$(echo "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')

  # Skip comments and empty lines
  if [[ "$line" == \#* ]] || [[ -z "$line" ]]; then
    continue
  fi

  # Check if the line contains an equals sign and is not just an equals sign
  if [[ "$line" =~ "=" && "$line" != "=" ]]; then
    # Append to ENV_VARS, comma-separated
    if [ -z "$ENV_VARS" ]; then
      ENV_VARS="$line"
    else
      ENV_VARS="${ENV_VARS},$line"
    fi
  fi
done < "$ENV_FILE"
echo "Formatted ENV_VARS: ${ENV_VARS}"
# -------------------------------------------------

# Start the gcloud run deploy command
echo "Constructing deploy command..."
DEPLOY_COMMAND=(
gcloud run deploy "${SERVICE_NAME}"
  --image "${IMAGE_TAG}"
  --region "${REGION}"
  --platform managed
  --port "${PORT}"
  --allow-unauthenticated
)

# Add the --set-env-vars flag if variables were found
if [ -n "$ENV_VARS" ]; then
  DEPLOY_COMMAND+=(--set-env-vars "${ENV_VARS}")
fi

# Execute the deploy command
echo "Executing deploy command:"
# Print the command elements joined by space for clarity
printf '%s ' "${DEPLOY_COMMAND[@]}"; echo

# Execute the command using the array
"${DEPLOY_COMMAND[@]}"

echo "Deployment process finished."
