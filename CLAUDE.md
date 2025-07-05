# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a pnpm monorepo with multiple packages. Always use pnpm commands:

- `pnpm build` - Build all packages
- `pnpm dev` - Start all packages in development mode with watch
- `pnpm lint` - Run linting on all packages
- `pnpm format` - Format all code with prettier

### Package-specific commands

For individual packages (run from package directory):
- `pnpm build` - Build package using TypeScript compiler
- `pnpm dev` - Watch mode compilation
- `pnpm check-types` - Type checking without emit
- `pnpm lint` - ESLint with max warnings 0

## Project Structure

This is a TypeScript schema validation and form library called "dynz" with the following architecture:

### Core Packages

**packages/dynz/** - Main validation library
- `types.ts` - Comprehensive type definitions for schemas, rules, conditions, and validation
- `schema.ts` - Schema builders (string, number, object, array, dateString)
- `validate.ts` - Main validation logic and error handling
- `resolve.ts` - Property resolution and conditional logic
- `rules.ts` - Rule definitions and builders
- `conditions.ts` - Condition builders for dynamic validation
- `private.ts` - Private field masking utilities

**packages/dynz-veevalidate/** - VeeValidate integration
- Integrates dynz with VeeValidate for Vue.js forms

### Key Concepts

**Schemas** - Define data structure and validation rules:
- String, number, object, array, date string schemas
- Support for conditional validation, optional/required fields
- Private field masking capabilities
- Reference-based validation (cross-field validation)

**Rules** - Validation constraints:
- min/max, equals, regex, numeric, custom rules
- Conditional rules that apply based on other field values

**Conditions** - Dynamic validation logic:
- Supports AND/OR operators, comparisons, pattern matching
- Used for conditional required fields and rule application

**Validation Context** - Tracks current vs new values for mutation detection

### Examples

The repository includes Vue.js and Next.js examples demonstrating:
- Form validation with dynamic schemas
- Conditional field visibility and validation
- Integration with popular frameworks

## Environment Requirements

- Node.js >=22.14.0
- pnpm as package manager
- TypeScript for development

## Testing

The project uses Vitest for testing with workspace configuration:

- `pnpm test` - Run tests for all packages
- `pnpm -r run test` - Run tests recursively in all packages
- `vitest run` - Run tests directly (from package directory)

Test files should use the `.test.ts` extension and be located alongside source files.