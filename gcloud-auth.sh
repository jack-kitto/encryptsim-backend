#!/bin/bash

PROJECT_ID="esim-a3042"
REGION="us-west1"

show_help() {
  cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
  --login          Login to Google Cloud and set active account
  --service-key    Authenticate using service account key file
  --check          Check current authentication status
  --help, -h       Show this help message

EXAMPLES:
  $0 --login                     Login interactively
  $0 --service-key key.json      Use service account key file
  $0 --check                     Check authentication status

EOF
}

check_auth() {
  echo "Checking Google Cloud authentication status..."
  
  if ! command -v gcloud &> /dev/null; then
    echo "ERROR: gcloud CLI is not installed"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
  fi
  
  CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
  CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
  
  if [ -z "$CURRENT_ACCOUNT" ]; then
    echo "No active Google Cloud account found"
    return 1
  else
    echo "Active account: $CURRENT_ACCOUNT"
    echo "Current project: $CURRENT_PROJECT"
    
    if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
      echo "WARNING: Current project ($CURRENT_PROJECT) differs from expected ($PROJECT_ID)"
    fi
    
    return 0
  fi
}

login_interactive() {
  echo "Starting interactive Google Cloud login..."
  
  gcloud auth login
  
  if [ $? -eq 0 ]; then
    echo "Login successful!"
    echo "Setting project to: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
    gcloud config set compute/region "$REGION"
    echo "Authentication complete!"
  else
    echo "Login failed"
    exit 1
  fi
}

login_service_key() {
  local key_file="$1"
  
  if [ -z "$key_file" ]; then
    echo "ERROR: Service account key file not specified"
    exit 1
  fi
  
  if [ ! -f "$key_file" ]; then
    echo "ERROR: Service account key file not found: $key_file"
    exit 1
  fi
  
  echo "Authenticating with service account key: $key_file"
  
  gcloud auth activate-service-account --key-file="$key_file"
  
  if [ $? -eq 0 ]; then
    echo "Service account authentication successful!"
    echo "Setting project to: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
    gcloud config set compute/region "$REGION"
    echo "Authentication complete!"
  else
    echo "Service account authentication failed"
    exit 1
  fi
}

if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

for arg in "$@"
do
  case $arg in
    --login)
    login_interactive
    shift
    ;;
    --service-key)
    shift
    login_service_key "$1"
    shift
    ;;
    --check)
    check_auth
    shift
    ;;
    --help|-h)
    show_help
    exit 0
    ;;
    *)
    echo "Unknown option: $arg"
    show_help
    exit 1
    ;;
  esac
done