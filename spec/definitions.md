# `definitions/` Directory Specification

```text
Document: TOOLS-EXT-SPEC-004
Component: tools/<toolset-name>/definitions/
Status: Draft (v0.1.0)
```

## Abstract

This document specifies the `definitions/` directory inside a toolset, which stores declarative, static tool schemas exposed to agent models and used by hosts to validate tool inputs and outputs.

## Normative Requirements Language

The key words **"MUST"**, **"MUST NOT"**, **"REQUIRED"**, **"SHALL"**, **"SHALL NOT"**, **"SHOULD"**, **"SHOULD NOT"**, **"RECOMMENDED"**, **"MAY"**, and **"OPTIONAL"** in this document are to be interpreted as described in RFC 2119 and RFC 8174.

## Purpose

The `definitions/` directory isolates tool interface contracts from implementation code. Because definitions are purely declarative data files, an agent host MUST be able to parse, index, and present all tool definitions to a model without executing any handler or module code.

## File Organization

- Each tool SHOULD have its own definition file named `<tool-name>.json` inside `definitions/`.
- Definition files MUST be valid UTF-8 JSON (RFC 8259).
- Subdirectories MAY be used inside `definitions/` for grouping large toolsets, provided `tools.json` references the exact relative path.
- Definition files MUST NOT contain executable code.

## Tool Definition Schema

Each definition file MUST be a JSON object with the following fields:

| Field | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | REQUIRED | Tool identifier. MUST match the corresponding `tools[].name` in `tools.json`. |
| `description` | `string` | REQUIRED | Clear description of when and how an agent should invoke the tool. |
| `inputSchema` | `object` | REQUIRED | JSON Schema (Draft 2020-12 compatible) object describing accepted arguments. |
| `outputSchema` | `object` | OPTIONAL | JSON Schema object describing the structured `data` field of a success envelope (media attachments are returned separately in `media[]`). |
| `vars` | `object` | OPTIONAL | Map of host-resolved tool variables required or accepted by this tool (overrides or extends `tools.json` `vars`). |
| `annotations` | `object` | OPTIONAL | Behavioral hints for hosts and safety gates. |

### Tool Variables (`vars`)

Tool variables represent host-resolved configuration and context values (such as working directory, scope restrictions, endpoints, or timeouts) that control handler behavior without being supplied by the agent model.

Each entry in `vars` maps a variable name (`^[a-zA-Z_][a-zA-Z0-9_]*$`) to a variable declaration object:

| Field | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `type` | `string` | REQUIRED | Expected datatype. MUST be one of `"string"`, `"number"`, `"integer"`, `"boolean"`, `"array"`, or `"object"`. |
| `required` | `boolean` | OPTIONAL | Whether the host MUST provide a value before invoking the handler. Defaults to `false`. |
| `default` | *any* | OPTIONAL | Fallback value applied when `required` is `false` and no scope provides a value. MUST match `type`. |
| `secret` | `boolean` | OPTIONAL | Marks the variable as sensitive (such as API keys or tokens). Defaults to `false`. |
| `description` | `string` | OPTIONAL | Human-readable explanation of how the handler uses this variable. |

- `vars` MUST NOT be merged into `inputSchema` or requested as model-generated tool arguments.
- If `required` is `true`, `default` SHOULD be omitted.
- When `secret` is `true`, the host MUST redact the resolved value from logs, telemetry, error payloads, and model prompts, and SHOULD resolve the value from a host secret store when available.
- Tool-level `vars` entries override toolset-level `vars` entries in `tools.json` with the same key.

### Optional `annotations` Fields

| Field | Type | Default | Meaning |
| :--- | :--- | :--- | :--- |
| `readOnly` | `boolean` | `false` | Tool does not modify external or local state. |
| `destructive` | `boolean` | `false` | Tool may delete or irreversibly alter state. |
| `idempotent` | `boolean` | `false` | Repeated calls with identical arguments produce the same effect. |
| `networkAccess` | `boolean` | `false` | Tool makes outbound network requests. |

## Example Definition (`definitions/get-current-weather.json`)

```json
{
  "name": "get-current-weather",
  "description": "Retrieve the current temperature and weather conditions for a city.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "City name, optionally qualified with region or country."
      },
      "units": {
        "type": "string",
        "enum": ["metric", "imperial"],
        "default": "metric",
        "description": "Measurement unit system."
      }
    },
    "required": ["city"],
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "city": { "type": "string" },
      "temperature": { "type": "number" },
      "conditions": { "type": "string" }
    },
    "required": ["city", "temperature", "conditions"]
  },
  "vars": {
    "defaultUnits": {
      "type": "string",
      "required": false,
      "default": "metric",
      "description": "Default unit system when not specified by the caller."
    }
  },
  "annotations": {
    "readOnly": true,
    "destructive": false,
    "idempotent": true,
    "networkAccess": true
  }
}
```

## Validation Rules

1. `inputSchema` MUST have `"type": "object"`.
2. Hosts MUST validate tool call arguments against `inputSchema` prior to invoking the mapped handler.
3. For every declared entry in `vars`, the host MUST validate `type` compatibility and enforce `required: true` prior to invoking the mapped handler.
4. Unreferenced files inside `definitions/` MUST NOT be registered as callable tools.

## Related Specifications

- [Overall Specification](../README.md)
- [tools.json Manifest](./tools-json.md)
- [handlers/ Folder](./handlers.md)
