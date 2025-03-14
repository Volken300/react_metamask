#!/bin/bash

set -e

echo "Starting deployment process..."

# Build the React application
echo "Building the React application..."
npm run build

# AWS S3 bucket name where we'll host our static files
BUCKET_NAME="retail-chain-dapp"

# Create S3 bucket if it doesn't exist
echo "Creating S3 bucket if it doesn't exist..."
aws s3api create-bucket \
    --bucket $BUCKET_NAME \
    --region us-east-1

# Enable static website hosting
echo "Enabling static website hosting..."
aws s3 website s3://$BUCKET_NAME/ \
    --index-document index.html \
    --error-document index.html

# Configure bucket policy for public access
echo "Configuring bucket policy for public access..."
aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'"$BUCKET_NAME/*"'
        }
    ]
}'

# Upload the built files to S3
echo "Uploading built files to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME/

# Get the website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"

echo "\nDeployment completed successfully!"
echo "Your website is now available at: $WEBSITE_URL"