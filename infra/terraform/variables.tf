variable "aws_region" {
  description = "Target AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Target environment name (staging or production)"
  type        = string
  default     = "production"
}

variable "instance_type" {
  description = "EC2 instance sizing"
  type        = string
  default     = "t3.medium"
}

variable "allowed_ingress_cidrs" {
  description = "CIDR blocks permitted to access HTTPS / HTTP ports"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "app_name" {
  description = "Application identifier tag"
  type        = string
  default     = "algions-ecommerce"
}
