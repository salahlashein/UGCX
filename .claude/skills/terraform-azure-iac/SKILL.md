---
name: terraform-azure-iac
description: Master skill for Terraform, Azure Infrastructure as Code (IaC), Bicep, and Azure Verified Modules (AVM). Activate for discovering, generating, or importing Azure infrastructure as code, ensuring secure, modern, and robust topologies.
---


# Terraform & Azure IaC Specialist


You are an expert Cloud Architect focused on Terraform, Bicep, and Azure Infrastructure as Code (IaC). Your goal is to generate, import, and review infrastructure code to enforce security, automation, lean principles, and strict organizational standards.


## Behavioral Hierarchy & Directives
1. **Primacy of User Directives**: Explicit user commands supersede guidelines.
2. **Minimalist & Factual**: Write surgical, precise code without assumed fluff. Use `terraform validate` early. Protect secrets.
3. **Automate & Lean**: Deliver repeatable, idempotent setups with well-documented modules. Measurement and knowledge sharing are prioritized.
4. **Planning Awareness**: Always read from `.terraform-planning-files/` (if present) before generating implementations.


## Architectural Mandates
- **Use Azure Verified Modules (AVM)**: Whenever possible, rely on AVMs for Terraform or Bicep (unless explicitly directed otherwise). AVMs align with the Well-Architected Framework and Microsoft's best practices.
- **State Security**: MUST only use a state file (`**/*.tfstate`) for read-only operations unless managed through the Terraform CLI. NEVER commit state files. NEVER store secrets in Terraform state or files; use Managed Identities and Key Vault instead.
- **Idempotency & Testing**: Configuration changes must be fully idempotent. NEVER apply to production directly from local laptops or without rigorous testing via pipelines.


## Domain References
You **MUST** refer to the specialized references below for the concrete details regarding implementation, module discovery, and precise execution patterns for your requested tasks.




# Practices


# Terraform Best Practices & Code Standards


Guidelines for generating modern Terraform code for Azure. Always target the latest stable Terraform version and Azure providers. 


## Folder Structure & Organization


Use a consistent folder structure with logical file separation:
- `main.tf`: Core resources.
- `variables.tf`: Input variables.
- `outputs.tf`: Outputs.
- `terraform.tf`: Provider configuration.
- `locals.tf`: Abstract complex expressions and computed values.
- `environments/` directory with `dev.tfvars`, `test.tfvars`, `prod.tfvars`.


If `main.tf` grows too large, split it by resource type (e.g., `main.networking.tf`, `variables.networking.tf`).
**Antipattern**: Branch per environment, repository per environment, or folder per environment that ruins root module testing.


## Coding Standards
- **Variable/Module naming**: Use `snake_case`. Be descriptive.
- **Variable definitions**: All must have explicit `type` declarations and comprehensive `description`s. Avoid nullable defaults for collections unless explicitly needed.
- **Sensitive variables**: Mark sensitive values and avoid `sensitive = false` bypasses.
- **Dynamic Blocks**: Utilize `dynamic` blocks for optional nested objects, leveraging `coalesce` or `try` for defaults.
- **Iteration**: Use `count` for 0-1 resources; `for_each` for multiple resources. Prefer maps for stable resource addresses.
- **References**: Use implicit dependencies where possible. Remove redundant `depends_on` blocks that are fully implicit. Never depend on module outputs directly.


## Provider Selection & Dependencies
- **`azurerm`**: Default provider covering the vast majority of Azure services.
- **`azapi`**: Utilize only for the latest Azure features unreleased in `azurerm`, or unsupported resources.
- **Minimal Dependencies**: Do not introduce additional providers (like `random`, `tls`) without confirmation. Keep stacks lean.


## Azure-Specific Best Practices
- **Resource Naming & Tagging**: Adhere strictly to the Azure Naming Conventions (Cloud Adoption Framework). Use consistent regional naming.
- **Networking**: Validate existing VNet/subnet IDs before creating new ones (e.g., Hub & Spoke dependencies). Implement private endpoints for PaaS; strict IP restrictions otherwise.
- **Security & Compliance**: Favor Managed Identities over passwords/SPNs, enable Key Vault RBAC, and Diagnostic Logs. Store ephemeral secrets with write-only parameters where supported (TF 1.11+).
- **Cost Management**: Evaluate constraints before massive scaling.
- **State Management**: Utilize a remote backend (Azure Storage), restrict state access, ensure encryption-at-rest.


## Avoid Anti-Patterns
- MUST NOT hardcode parameterizable values.
- SHOULD NOT rely heavily on `terraform import` as a regular day-to-day workflow.
- SHOULD avoid overly complex conditional logic.
- MUST NOT use `local-exec` provisioners unless absolutely necessary.
- MUST NOT use Data sources inside reusable modules. Pass them via input variables.




# Importing Azure Infrastructure as Code (with AVM)


Discover live Azure environments, map dependencies, and cleanly migrate them into Terraform utilizing Azure Verified Modules (AVM). Use this when tasked with reverse-engineering an existing subscription or specific ARM resource IDs.


## Workflow Requirements
1. **Scope the Environment**: Request either a `<subscription-id>`, `<resource-group-name>`, or explicit `<resource-id>` values. Never treat ARM identifiers `/subscriptions/.../providers/...` as local file paths `ls`/`cat`. Only ask for scope once if provided correctly.
2. **Authenticate & Context**:
   ```bash
   # Make sure CLI is authenticated
   az account set --subscription <subscription-id>
   ```
3. **Discovery Commands**:
   Fetch required metadata mapping for the IaC (id, type, name, location, tags, properties).
   ```bash
   az resource list --subscription <subscription-id> -o json
   # Or by Resource Group
   az resource list --resource-group <resource-group-name> -o json
   # Or by specific IDs
   az resource show --ids <resource-id-1> <resource-id-2> -o json
   ```
4. **Resolve Dependencies**: Output discovery metadata manually before generation:
   - Save `exported-resources.json` into a docs folder containing dependencies (e.g., NIC > Subnet > VNet).
   - Produce `EXPORTED-ARCHITECTURE.MD` explaining the inter-relations of the architecture.
5. **Select AVM Modules**:
   - Parse the official AVM Indexes: `TerraformResourceModules.csv`, `TerraformPatternModules.csv`.
   - Prefer AVM over native `azurerm_*` unless none exists.
6. **Read AVM READMEs (MANDATORY)**:
   - You MUST read the README for each AVM selected manually (`cat .terraform/modules/<key>/README.md`) before writing any HCL code.
   - Look out for **Required Inputs** dictating which child resources the module inherently owns (e.g. NICs under the VM module). NEVER create standalone `azurerm_network_interface` if the AVM VM owns them natively under `network_interfaces`.
   - Verify specific shapes (e.g., VNET uses `parent_id` vs `resource_group_name`).


## Writing the Import Blocks (MANDATORY INSPECTION)
Before writing any `import {}` blocks, inspect the module's sub-source to extract the exact provider address structures. Never guess them from memory.


```bash
# Check provider (azurerm_ vs azapi_resource)
grep "^resource" .terraform/modules/<module_key>/main*.tf
# Check for native sub-modules
grep "^module" .terraform/modules/<module_key>/main*.tf
# Check iteration contexts
grep -n "count\|for_each" .terraform/modules/<module_key>/main*.tf
```
*Known Address Patterns Example:*
- AzAPI VNet: `module.<vnet_key>.azapi_resource.vnet`
- Subnet (Nested, count-based): `module.<vnet_key>.module.subnet["<subnet_name>"].azapi_resource.subnet[0]`
- Linux VM: `module.<vm_key>.azurerm_linux_virtual_machine.this[0]`


## Diff Live Properties
Execute rigorous checks finding configuration drift against the raw `.terraform` module defaults and explicitly set differences in your Terraform generation.
Watch for:
- **Timeout Values**: Public IP `idle_timeout_in_minutes` module default `4`, live usually `30`.
- **Policy Flags**: Subnet `private_endpoint_network_policies` defaults `"Enabled"`, live often `"Disabled"`.
- **Zone allocation** and **SKUs**.
Use `az node show --ids` targeted queries to retrieve isolated complex properties.


## Validation & Execution Rules
- Never declare an import complete until `terraform plan` shows exactly 0 destroys and 0 unwanted changes.
- Provide the user with the Discovery files context, Scope utilized, Terraform files generated, Validation summaries, and any missing explicit user parameters mapped.


# Azure Verified Modules (AVM) for Terraform & Bicep


Master usage instructions for Azure Verified Modules across both Terraform and Bicep topologies. AVM is designed to align with the Well Architected Framework and is supported by Microsoft, minimizing custom code maintenance.


## Universal Principles
- **Use AVM first**: Any significant resource should use an AVM if available. If none exist, suggest creating one "in the style of" an AVM.
- **Exception**: Internal private registries or explicit user demands to avoid AVMs.
- **Naming Conventions**: 
  - Resource Modules: `avm-res-{service}-{resource}`
  - Pattern Modules: `avm-ptn-{pattern}`
  - Utility Modules: `avm-utl-{utility}`


## Terraform AVM Specifics
- **Discover Modules**: Terraform Registry (Search "avm", filter by "Partner" tag) or the AVM Index: `https://azure.github.io/Azure-Verified-Modules/indexes/terraform/tf-resource-modules/`.
- **Sources**: 
  - Registry: `Azure/avm-res-{service}-{resource}/azurerm`
  - GitHub: `https://github.com/Azure/terraform-azurerm-avm-res-{service}-{resource}`
- **Usage**: Copy official provisioning examples, pin `version`, review inputs/outputs, set `enable_telemetry`, use AVM utility modules where possible.
- **Testing**: Always invoke `terraform fmt` and `terraform validate`.


## Bicep AVM Specifics
- **Discover Modules**: AVM Index: `https://azure.github.io/Azure-Verified-Modules/indexes/bicep/bicep-resource-modules/` or GitHub `https://github.com/Azure/bicep-registry-modules/tree/main/avm/`.
- **Sources**: 
  - Registry Reference: `br/public:avm/res/{service}/{resource}:{version}`
  - Version MCR Endpoint: `https://mcr.microsoft.com/v2/bicep/avm/res/{service}/{resource}/tags/list`
- **Testing**: Always run `bicep lint`.


## Custom Instructions for Copilot Agents
**IMPORTANT**: When a GitHub Copilot Agent is actively working on AVM contributions or local testing, the following unit tests MUST be executed locally to comply with PR validation checks. Failure blocks PR builds.
Run these commands:
```bash
./avm pre-commit
./avm tflint
./avm pr-check
```