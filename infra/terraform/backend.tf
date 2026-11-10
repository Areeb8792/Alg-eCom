# ==============================================================================
# Algions Platform — Terraform Remote State Configuration
# Secure S3 Backend with Server-Side Encryption and DynamoDB State Locking
# ==============================================================================

# Note: In production CI/CD, initialize with:
# terraform init \
#   -backend-config="bucket=algions-terraform-state-prod" \
#   -backend-config="key=ecommerce/terraform.tfstate" \
#   -backend-config="region=us-east-1" \
#   -backend-config="dynamodb_table=algions-terraform-locks" \
#   -backend-config="encrypt=true"

terraform {
  backend "s3" {
    bucket         = "algions-terraform-state-prod"
    key            = "ecommerce/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "algions-terraform-locks"
    encrypt        = true
  }
}
