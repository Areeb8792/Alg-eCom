output "instance_id" {
  description = "EC2 Instance ID for AWS Systems Manager Session Connection"
  value       = aws_instance.app_server.id
}

output "public_ip" {
  description = "Public IP address assigned to the application server"
  value       = aws_instance.app_server.public_ip
}

output "security_group_id" {
  description = "ID of the attached security group"
  value       = aws_security_group.web_sg.id
}

output "ssm_connect_command" {
  description = "AWS CLI command to start secure shell session via SSM (No port 22 required)"
  value       = "aws ssm start-session --target ${aws_instance.app_server.id} --region ${var.aws_region}"
}
