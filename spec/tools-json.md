# `tools.json` Manifest Specification

```text
Document: TOOLS-EXT-SPEC-003
Component: tools/<toolset-name>/tools.json
Status: Draft (v0.1.0)
```

## Abstract

This document specifies the schema, fields, and validation rules for the `tools.json` manifest file located at the root of each `tools/<toolset-name>/` directory.

## Normative Requirements Language

The key words **"MUST"**, **"MUST NOT"**, **"REQUIRED"**, **"SHALL"**, **"SHALL NOT"**, **"SHOULD"**, **"SHOULD NOT"**, **"RECOMMENDED"**, **"MAY"**, and **"OPTIONAL"** in this document are to be interpreted as described in RFC 2119 and RFC 8174.

## Purpose

`tools.json` is the single source of truth for registering a toolset and binding each declarative definition in `definitions/` to its executable entrypoint in `handlers/`. Hosts MUST read `tools.json` as strict JSON (RFC 8259) encoded in UTF-8.

## Top-Level Fields

| Field | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `schemaVersion` | `string` | REQUIRED | Specification version this manifest conforms to (SemVer, e.g. `"0.1.0"`). |
| `name` | `string` | REQUIRED | Toolset identifier. MUST match the parent `<toolset-name>` directory name. |
| `version` | `string` | REQUIRED | Semantic version of the toolset (e.g. `"1.0.0"`). |
| `description` | `string` | REQUIRED | Concise summary of what the toolset provides. |
| `runtime` | `string` | OPTIONAL | Default execution runtime hint for handlers (e.g. `"node"`, `"python"`, `"shell"`, `"binary"`). |
| `vars` | `object` | OPTIONAL | Map of shared tool variable declarations inherited by all tools in the toolset (see [Tool Variables (`vars`)](./definitions.md#tool-variables-vars)). |
| `tools` | `array` | REQUIRED | Non-empty array of tool binding objects. |

## Tool Binding Object (`tools[]`)

Each element in the `tools` array registers one callable tool:

| Field | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | REQUIRED | Unique tool identifier within the toolset (`^[a-z0-9]+(?:[-_][a-z0-9]+)*$`). |
| `definition` | `string` | REQUIRED | Relative POSIX path to a definition file inside `definitions/`. |
| `handler` | `string` | REQUIRED | Relative POSIX path to an executable handler inside `handlers/`. |
| `enabled` | `boolean` | OPTIONAL | Controls whether the host exposes the tool. Defaults to `true`. |
| `runtime` | `string` | OPTIONAL | Per-tool runtime override when different from the top-level `runtime`. |

## Example `tools.json`

```json
{
  "schemaVersion": "0.1.0",
  "name": "weather",
  "version": "1.0.0",
  "description": "Tools for querying current weather conditions and forecasts.",
  "runtime": "node",
  "vars": {
    "apiBaseUrl": {
      "type": "string",
      "required": true,
      "description": "Base URL for the weather service API."
    },
    "timeoutMs": {
      "type": "integer",
      "required": false,
      "default": 5000,
      "description": "HTTP request timeout in milliseconds."
    }
  },
  "tools": [
    {
      "name": "get-current-weather",
      "definition": "definitions/get-current-weather.json",
      "handler": "handlers/get-current-weather.mjs",
      "enabled": true
    },
    {
      "name": "get-forecast",
      "definition": "definitions/get-forecast.json",
      "handler": "handlers/get-forecast.mjs",
      "enabled": true
    }
  ]
}
```

## Validation Rules

1. `name` MUST equal the enclosing `<toolset-name>` directory name.
2. Every `tools[].name` MUST be unique within the same `tools.json` file.
3. Every `tools[].definition` path MUST start with `definitions/` and resolve to an existing file inside `tools/<toolset-name>/definitions/`.
4. Every `tools[].handler` path MUST start with `handlers/` and resolve to an existing file inside `tools/<toolset-name>/handlers/`.
5. Any path containing `..` segments or leading `/` characters MUST be rejected.
6. The `name` declared inside a referenced definition file MUST match `tools[].name`.
7. If both `tools.json` and a tool's definition file declare the same key in `vars`, the tool definition's declaration MUST take precedence for that tool.
8. Unknown top-level or tool-level fields prefixed with `x-` MAY be preserved for host-specific extensions.

## Related Specifications

- [Overall Specification](../README.md)
- [tools/ Directory](./tools.md)
- [definitions/ Folder](./definitions.md)
- [handlers/ Folder](./handlers.md)
