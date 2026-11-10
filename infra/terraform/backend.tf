# ==============================================================================
# Algions Platform — Terraform Remote State Configuration
# Modern Native S3 Locking (use_lockfile = true) with Server-Side Encryption
# Eliminates legacy DynamoDB table dependency using S3 conditional writes.
# ==============================================================================

# Note: In production CI/CD, initialize with:
# terraform init \
#   -backend-config="bucket=algions-terraform-state-prod" \
#   -backend-config="key=ecommerce/terraform.tfstate" \
#   -backend-config="region=us-east-1" \
#   -backend-config="encrypt=true" \
#   -backend-config="use_lockfile=true"

terraform {
  backend "s3" {
    bucket       = "algions-terraform-state-prod"
    key          = "ecommerce/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true # SSE-S3 (Server-Side Encryption with Amazon S3-Managed Keys: AES256)
    use_lockfile = true # Native S3 state locking via object conditional writes (Terraform 1.10+)
  }
}
