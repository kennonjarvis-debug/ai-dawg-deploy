#!/bin/bash

###############################################################################
# DAWG AI - S3 Storage Setup Script
#
# This script sets up AWS S3 bucket for audio file storage
#
# Usage:
#   ./scripts/setup-s3.sh [create|configure|test]
#
# Options:
#   create    - Create S3 bucket and IAM user
#   configure - Configure bucket CORS and policies
#   test      - Test bucket access and upload
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="${AWS_S3_BUCKET:-dawg-ai-audio-production}"
REGION="${AWS_REGION:-us-east-1}"
IAM_USER="dawg-ai-s3-user"

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check AWS CLI
    if ! command_exists aws; then
        print_error "AWS CLI is not installed."
        print_info "Install from: https://aws.amazon.com/cli/"
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        print_error "AWS credentials not configured."
        print_info "Run: aws configure"
        exit 1
    fi

    # Get AWS account info
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_success "AWS Account: $ACCOUNT_ID"
    print_success "Region: $REGION"
}

# Create S3 bucket
create_bucket() {
    print_info "Creating S3 bucket: $BUCKET_NAME..."

    # Check if bucket already exists
    if aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
        print_warning "Bucket $BUCKET_NAME already exists"
        read -p "Continue with existing bucket? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        # Create bucket
        if [ "$REGION" == "us-east-1" ]; then
            aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
        else
            aws s3 mb "s3://$BUCKET_NAME" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION"
        fi
        print_success "Bucket created: $BUCKET_NAME"
    fi

    # Enable versioning
    print_info "Enabling versioning..."
    aws s3api put-bucket-versioning \
        --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled \
        --region "$REGION"
    print_success "Versioning enabled"

    # Enable encryption
    print_info "Enabling server-side encryption..."
    aws s3api put-bucket-encryption \
        --bucket "$BUCKET_NAME" \
        --server-side-encryption-configuration '{
          "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
              "SSEAlgorithm": "AES256"
            }
          }]
        }' \
        --region "$REGION"
    print_success "Encryption enabled (AES-256)"

    # Block public access (but allow through bucket policy)
    print_info "Configuring public access settings..."
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
            "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
        --region "$REGION"
    print_success "Public access configured"

    # Add lifecycle policy
    print_info "Adding lifecycle policy (archive to Glacier after 90 days)..."
    cat > /tmp/lifecycle-policy.json <<EOF
{
  "Rules": [
    {
      "Id": "ArchiveOldAudio",
      "Filter": {
        "Prefix": "generated/"
      },
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }
  ]
}
EOF
    aws s3api put-bucket-lifecycle-configuration \
        --bucket "$BUCKET_NAME" \
        --lifecycle-configuration file:///tmp/lifecycle-policy.json \
        --region "$REGION"
    rm /tmp/lifecycle-policy.json
    print_success "Lifecycle policy applied"
}

# Configure bucket CORS and policies
configure_bucket() {
    print_info "Configuring bucket CORS and policies..."

    # CORS configuration
    print_info "Setting CORS configuration..."
    cat > /tmp/cors-config.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://www.dawg-ai.com",
        "https://dawg-ai.com",
        "http://localhost:5173",
        "http://localhost:3001"
      ],
      "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF
    aws s3api put-bucket-cors \
        --bucket "$BUCKET_NAME" \
        --cors-configuration file:///tmp/cors-config.json \
        --region "$REGION"
    rm /tmp/cors-config.json
    print_success "CORS configuration applied"

    # Bucket policy for public read access
    print_info "Setting bucket policy for public read access..."
    cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/generated/*"
    }
  ]
}
EOF
    aws s3api put-bucket-policy \
        --bucket "$BUCKET_NAME" \
        --policy file:///tmp/bucket-policy.json \
        --region "$REGION"
    rm /tmp/bucket-policy.json
    print_success "Bucket policy applied"

    # Add tags
    print_info "Adding tags..."
    aws s3api put-bucket-tagging \
        --bucket "$BUCKET_NAME" \
        --tagging 'TagSet=[
          {Key=Project,Value=DAWG-AI},
          {Key=Environment,Value=Production},
          {Key=Purpose,Value=AudioStorage}
        ]' \
        --region "$REGION"
    print_success "Tags applied"
}

# Create IAM user with S3 permissions
create_iam_user() {
    print_info "Creating IAM user: $IAM_USER..."

    # Check if user already exists
    if aws iam get-user --user-name "$IAM_USER" &>/dev/null; then
        print_warning "IAM user $IAM_USER already exists"
        read -p "Recreate access keys? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    else
        # Create user
        aws iam create-user --user-name "$IAM_USER"
        print_success "IAM user created: $IAM_USER"
    fi

    # Create inline policy
    print_info "Attaching S3 permissions policy..."
    cat > /tmp/iam-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$BUCKET_NAME",
        "arn:aws:s3:::$BUCKET_NAME/*"
      ]
    }
  ]
}
EOF
    aws iam put-user-policy \
        --user-name "$IAM_USER" \
        --policy-name "DAWG-AI-S3-Access" \
        --policy-document file:///tmp/iam-policy.json
    rm /tmp/iam-policy.json
    print_success "Policy attached"

    # Delete old access keys
    print_info "Cleaning up old access keys..."
    OLD_KEYS=$(aws iam list-access-keys --user-name "$IAM_USER" --query 'AccessKeyMetadata[*].AccessKeyId' --output text)
    for KEY in $OLD_KEYS; do
        aws iam delete-access-key --user-name "$IAM_USER" --access-key-id "$KEY"
        print_info "Deleted old key: $KEY"
    done

    # Create new access key
    print_info "Creating new access key..."
    ACCESS_KEY_JSON=$(aws iam create-access-key --user-name "$IAM_USER" --output json)
    ACCESS_KEY_ID=$(echo "$ACCESS_KEY_JSON" | grep -o '"AccessKeyId": "[^"]*' | cut -d'"' -f4)
    SECRET_ACCESS_KEY=$(echo "$ACCESS_KEY_JSON" | grep -o '"SecretAccessKey": "[^"]*' | cut -d'"' -f4)

    print_success "Access key created!"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  AWS CREDENTIALS - Save these to your .env file"
    echo "═══════════════════════════════════════════════════════════"
    echo "AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID"
    echo "AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY"
    echo "AWS_REGION=$REGION"
    echo "AWS_S3_BUCKET=$BUCKET_NAME"
    echo "═══════════════════════════════════════════════════════════"
    echo ""

    # Update .env file
    read -p "Update .env file automatically? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        update_env_file "$ACCESS_KEY_ID" "$SECRET_ACCESS_KEY"
    else
        print_warning "Please manually update your .env file with the credentials above"
    fi
}

# Update .env file
update_env_file() {
    local access_key=$1
    local secret_key=$2

    if [ ! -f .env ]; then
        print_warning ".env file not found, creating new one..."
        touch .env
    fi

    print_info "Updating .env file..."

    # Update or add each variable
    for VAR in "AWS_S3_BUCKET=$BUCKET_NAME" \
               "AWS_ACCESS_KEY_ID=$access_key" \
               "AWS_SECRET_ACCESS_KEY=$secret_key" \
               "AWS_REGION=$REGION" \
               "USE_S3=true"; do

        VAR_NAME=$(echo "$VAR" | cut -d= -f1)
        VAR_VALUE=$(echo "$VAR" | cut -d= -f2-)

        if grep -q "^${VAR_NAME}=" .env; then
            # Update existing
            sed -i.bak "s|^${VAR_NAME}=.*|${VAR}|" .env
        else
            # Add new
            echo "$VAR" >> .env
        fi
    done

    print_success ".env file updated"
}

# Test bucket access
test_bucket() {
    print_info "Testing S3 bucket access..."

    # Check if bucket exists
    if ! aws s3 ls "s3://$BUCKET_NAME" --region "$REGION" &>/dev/null; then
        print_error "Cannot access bucket: $BUCKET_NAME"
        print_info "Run: ./scripts/setup-s3.sh create"
        exit 1
    fi
    print_success "Bucket accessible"

    # Create test file
    TEST_FILE="/tmp/dawg-ai-test-$(date +%s).txt"
    echo "DAWG AI S3 Test - $(date)" > "$TEST_FILE"

    # Upload test file
    print_info "Uploading test file..."
    if aws s3 cp "$TEST_FILE" "s3://$BUCKET_NAME/test/" --region "$REGION"; then
        print_success "Upload successful"
    else
        print_error "Upload failed"
        exit 1
    fi

    # Download test file
    print_info "Downloading test file..."
    DOWNLOAD_FILE="/tmp/dawg-ai-download-$(date +%s).txt"
    if aws s3 cp "s3://$BUCKET_NAME/test/$(basename "$TEST_FILE")" "$DOWNLOAD_FILE" --region "$REGION"; then
        print_success "Download successful"
    else
        print_error "Download failed"
        exit 1
    fi

    # Verify content
    if diff "$TEST_FILE" "$DOWNLOAD_FILE" &>/dev/null; then
        print_success "File integrity verified"
    else
        print_error "File integrity check failed"
        exit 1
    fi

    # Clean up
    print_info "Cleaning up test files..."
    aws s3 rm "s3://$BUCKET_NAME/test/$(basename "$TEST_FILE")" --region "$REGION"
    rm "$TEST_FILE" "$DOWNLOAD_FILE"
    print_success "Test files removed"

    # Test signed URL generation (if Node.js is available)
    if command_exists node; then
        print_info "Testing signed URL generation..."
        cat > /tmp/test-signed-url.js <<'EOF'
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function testSignedUrl() {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: 'test/signed-url-test.txt'
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        console.log('✓ Signed URL generated successfully');
        console.log('URL length:', url.length);
        return true;
    } catch (error) {
        console.error('✗ Signed URL generation failed:', error.message);
        return false;
    }
}

testSignedUrl();
EOF
        if node /tmp/test-signed-url.js; then
            print_success "Signed URL generation works"
        else
            print_warning "Signed URL generation failed (this may require AWS SDK installation)"
        fi
        rm /tmp/test-signed-url.js
    fi

    print_success "All tests passed! ✓"
}

# Show bucket info
show_info() {
    print_info "S3 Bucket Information:"
    echo ""
    echo "  Bucket Name: $BUCKET_NAME"
    echo "  Region: $REGION"
    echo "  URL: https://$BUCKET_NAME.s3.$REGION.amazonaws.com"
    echo "  ARN: arn:aws:s3:::$BUCKET_NAME"
    echo ""

    # Get bucket size
    print_info "Fetching bucket statistics..."
    SIZE=$(aws s3 ls "s3://$BUCKET_NAME" --recursive --summarize --region "$REGION" 2>/dev/null | \
           grep "Total Size" | awk '{print $3}')
    if [ -n "$SIZE" ]; then
        SIZE_MB=$((SIZE / 1024 / 1024))
        echo "  Storage Used: ${SIZE_MB}MB"
    fi

    # Get object count
    COUNT=$(aws s3 ls "s3://$BUCKET_NAME" --recursive --summarize --region "$REGION" 2>/dev/null | \
            grep "Total Objects" | awk '{print $3}')
    if [ -n "$COUNT" ]; then
        echo "  Object Count: $COUNT"
    fi

    echo ""
}

# Show usage
show_usage() {
    echo "Usage: $0 [create|configure|test|info]"
    echo ""
    echo "Commands:"
    echo "  create     - Create S3 bucket and IAM user with access keys"
    echo "  configure  - Configure bucket CORS, policies, and lifecycle"
    echo "  test       - Test bucket access and file upload/download"
    echo "  info       - Show bucket information and statistics"
    echo ""
    echo "Examples:"
    echo "  $0 create      # Initial setup"
    echo "  $0 configure   # Configure bucket settings"
    echo "  $0 test        # Verify setup"
    echo "  $0 info        # View bucket info"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_S3_BUCKET - Bucket name (default: dawg-ai-audio-production)"
    echo "  AWS_REGION    - AWS region (default: us-east-1)"
}

# Main script
main() {
    echo ""
    echo "╔═══════════════════════════════════════╗"
    echo "║   DAWG AI - S3 Storage Setup         ║"
    echo "╚═══════════════════════════════════════╝"
    echo ""

    # Check argument
    if [ $# -eq 0 ]; then
        print_error "No command specified"
        echo ""
        show_usage
        exit 1
    fi

    COMMAND=$1

    # Check prerequisites for all commands except help
    if [ "$COMMAND" != "help" ] && [ "$COMMAND" != "--help" ] && [ "$COMMAND" != "-h" ]; then
        check_prerequisites
        echo ""
    fi

    case $COMMAND in
        create)
            create_bucket
            create_iam_user
            configure_bucket
            echo ""
            print_success "✓ S3 setup complete!"
            echo ""
            print_info "Next steps:"
            echo "  1. Test the setup: ./scripts/setup-s3.sh test"
            echo "  2. View bucket info: ./scripts/setup-s3.sh info"
            echo "  3. Start using S3 in your application"
            ;;
        configure)
            configure_bucket
            echo ""
            print_success "✓ Configuration complete!"
            ;;
        test)
            test_bucket
            echo ""
            print_success "✓ All tests passed!"
            ;;
        info)
            show_info
            ;;
        help|--help|-h)
            show_usage
            exit 0
            ;;
        *)
            print_error "Invalid command: $COMMAND"
            echo ""
            show_usage
            exit 1
            ;;
    esac

    echo ""
}

# Run main function
main "$@"
