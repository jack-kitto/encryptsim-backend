#!/bin/bash

gcloud config set project esim-a3042

# Define the target image tag
IMAGE_TAG="us-west1-docker.pkg.dev/esim-a3042/cloud-run-source-deploy/idx-esim-backend-09657482:latest"
SERVICE_NAME="idx-esim-backend-09657482"
REGION="us-west1"
PORT="8080"
ENV_FILE=".env"

# Function to configure deployment settings based on mode
configure_mode() {
  local mode=$1
  case $mode in
    prod)
      IMAGE_TAG="us-west1-docker.pkg.dev/esim-a3042/cloud-run-source-deploy/idx-esim-backend-09657482:prod-latest"
      SERVICE_NAME="idx-esim-backend-09657482"
      ;;
    test)
      IMAGE_TAG="us-west1-docker.pkg.dev/esim-a3042/cloud-run-source-deploy/idx-esim-backend-09657482:test-latest"
      SERVICE_NAME="encrypt-sim-test"
      ;;
    *)
      echo "Invalid mode: $mode. Use 'prod' or 'test'."
      exit 1
      ;;
  esac
}

# Function to display help
show_help() {
  cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
  --build=MODE     Build and deploy container image
                   MODE can be 'prod' or 'test'
  --deploy=MODE    Deploy existing container image without building
                   MODE can be 'prod' or 'test'
  --help, -h       Show this help message

EXAMPLES:
  $0 --build=prod      Build and deploy to prod (idx-esim-backend-09657482)
  $0 --build=test      Build and deploy to test (encrypt-sim-test)
  $0 --deploy=prod     Deploy existing prod image without building
  $0 --deploy=test     Deploy existing test image without building
  $0                   Deploy with default settings (latest image)

EOF
}

# Flag to control building the image
BUILD_IMAGE=false
BUILD_MODE=""

# Parse command-line arguments
for arg in "$@"
do
  case $arg in
    --build=*)
    BUILD_IMAGE=true
    BUILD_MODE="${arg#*=}"
    shift # Remove --build from processing
    ;;
    --deploy=*)
    BUILD_MODE="${arg#*=}"
    shift # Remove --deploy from processing
    ;;
    --help|-h)
    show_help
    exit 0
    ;;
    *)
    # Ignore other arguments for now or add more cases later
    ;;
  esac
done

# Configure deployment settings based on mode
if [ -n "$BUILD_MODE" ]; then
  configure_mode "$BUILD_MODE"
fi

# Conditionally build and push the container image
if [ "$BUILD_IMAGE" = true ]; then
  if [ -n "$BUILD_MODE" ]; then
    echo "Building and pushing container image for $BUILD_MODE..."
    gcloud builds submit --tag "${IMAGE_TAG}"
  else
    echo "Building and pushing container image..."
    gcloud builds submit --tag "${IMAGE_TAG}"
  fi
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
