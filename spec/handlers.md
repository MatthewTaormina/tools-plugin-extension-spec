# `handlers/` Directory Specification

```text
Document: TOOLS-EXT-SPEC-005
Component: tools/<toolset-name>/handlers/
Status: Draft (v0.1.0)
```

## Abstract

This document specifies the `handlers/` directory inside a toolset, which contains the executable entrypoints bound to tool definitions in `tools.json`.

## Normative Requirements Language

The key words **"MUST"**, **"MUST NOT"**, **"REQUIRED"**, **"SHALL"**, **"SHALL NOT"**, **"SHOULD"**, **"SHOULD NOT"**, **"RECOMMENDED"**, **"MAY"**, and **"OPTIONAL"** in this document are to be interpreted as described in RFC 2119 and RFC 8174.

## Purpose

Each file in `handlers/` implements the execution entrypoint for one registered tool. Handlers act as thin adapters that receive validated input from the host, delegate reusable logic to `modules/`, and return a structured result.

## File Organization

- Each registered tool SHOULD map to a dedicated handler file named `<tool-name>.<ext>` inside `handlers/`.
- Handlers MAY be authored in any language supported by the target host runtime (such as JavaScript/TypeScript, Python, shell scripts, or compiled executables).
- Shared helper logic used across multiple handlers SHOULD be extracted into `modules/` rather than duplicated across `handlers/`.
- Files in `handlers/` that are not referenced by `tools.json` MUST NOT be directly exposed as callable tools.

## Execution Contract

To remain language-agnostic while supporting both in-process and subprocess hosts, this specification defines a strictly request-response JSON envelope contract. Each invocation receives one input payload, produces one output envelope, and terminates within the host's configured timeout.

- Long-running asynchronous work exceeding a single invocation timeout SHOULD be split into separate start and status-check tools rather than spawning unmanaged background workers.
- Harnesses that offer persistent state or object storage SHOULD expose scoped paths or service endpoints through resolved `vars` (such as `stateDir` or `artifactDir`) rather than requiring language-specific host callbacks.

### Input Payload & Resolved Variables (`vars`)

When invoking a handler, the host passes validated arguments matching the tool's `inputSchema` alongside a flat key-value `vars` object containing host-resolved tool variables:

- **Subprocess / CLI Runtime**: The host passes a UTF-8 JSON object on `stdin` containing `{ "input": <arguments>, "vars": <resolved-vars> }`.
- **In-Process Runtime**: The host imports the handler module and invokes its default `execute(input, vars)` (or `handler(input, vars)`) export, where `vars` defaults to `{}` if no variables are resolved.

#### Scope Resolution Rules

The host owns variable resolution across its supported scopes so handlers remain portable and free of scope-precedence logic:

1. **Precedence**: Hosts MUST resolve variables from broadest scope to narrowest scope so narrower scopes override broader scopes (for example, `global` < `workspace` < `session` < `agent`). A standalone host MAY support a subset of scopes (such as `global` only).
2. **Type Validation**: Every resolved variable value MUST match the `type` declared in `tools.json` or `definitions/<tool>.json` (`string`, `number`, `integer`, `boolean`, `array`, or `object`). On mismatch, the host MUST reject the call prior to handler execution.
3. **Required vs. Optional**:
   - If a variable has `"required": true` and is absent from all active scopes, the host MUST abort invocation before executing the handler and report a missing-variable error.
   - If a variable has `"required": false` (or omits `required`) and is absent from all active scopes, the host MUST apply its declared `default` if present; otherwise the key is omitted from `vars`.
4. **Least Privilege**: Hosts SHOULD pass only the variables declared for the toolset and target tool rather than exposing all host-wide variables to every handler.

**Example Subprocess Input (`stdin`)**:

```json
{
  "input": {
    "city": "Toronto"
  },
  "vars": {
    "apiBaseUrl": "https://api.example.com/weather",
    "timeoutMs": 5000,
    "defaultUnits": "metric"
  }
}
```

### Output Payload

A handler MUST return a strict UTF-8 JSON object (via `stdout` for subprocesses or return value for in-process runtimes). Non-JSON raw output MUST be rejected by the host as `INVALID_OUTPUT`.

#### Success Envelope

```json
{
  "ok": true,
  "data": {
    "city": "Toronto",
    "temperature": 12.5,
    "conditions": "Partly cloudy"
  }
}
```

| Field | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `ok` | `boolean` | REQUIRED | MUST be `true` for a successful invocation. |
| `data` | *any JSON value* | OPTIONAL | Structured JSON result (string, number, boolean, array, object, or `null`). Validated against `outputSchema` when declared. At least one of `data` or `media` MUST be present. |
| `media` | `array` | OPTIONAL | Array of media attachment objects (images, audio, video, documents) returned alongside or instead of structured `data`. |

#### Media Attachment Objects (`media[]`)

Tools that produce binary or rich media MUST return them inside the JSON `media` array rather than writing raw binary bytes to `stdout`. Each item in `media` MUST be an object with:

| Field | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `mimeType` | `string` | REQUIRED | IANA media type (for example, `"image/png"`, `"audio/mpeg"`, `"video/mp4"`, `"application/pdf"`). |
| `data` | `string` | CONDITIONAL | Base64-encoded binary content for inline media. MUST be paired with `"encoding": "base64"`. Mutually exclusive with `uri`. |
| `encoding` | `string` | CONDITIONAL | MUST be `"base64"` when `data` is provided. |
| `uri` | `string` | CONDITIONAL | Reference URI (`file://` or `https://`) for large media assets to avoid inline base64 overhead. Mutually exclusive with `data`. |
| `name` | `string` | OPTIONAL | Suggested filename (for example, `"chart.png"`). |
| `alt` | `string` | OPTIONAL | Text description for accessibility or non-multimodal hosts. |
| `sizeBytes` | `integer` | OPTIONAL | Size of the media payload in bytes. |

- Each media item MUST specify either `data` (with `"encoding": "base64"`) OR `uri`, never both.
- Hosts SHOULD enforce a configurable maximum size for inline base64 media and recommend `uri` references for large assets (such as video or high-resolution images).

**Example Media Response**:

```json
{
  "ok": true,
  "data": {
    "summary": "Generated 7-day temperature chart for Toronto."
  },
  "media": [
    {
      "mimeType": "image/png",
      "uri": "file:///tmp/toronto-forecast.png",
      "name": "toronto-forecast.png",
      "alt": "Line chart showing 7-day temperatures in Toronto"
    }
  ]
}
```

#### Error Envelope

Both handlers (for domain errors) and hosts (for validation, timeout, or runtime errors) MUST use the same error envelope:

```json
{
  "ok": false,
  "error": {
    "code": "CITY_NOT_FOUND",
    "message": "No weather record found for the specified city.",
    "retryable": false,
    "details": {
      "city": "Atlantis"
    }
  }
}
```

| Field | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `ok` | `boolean` | REQUIRED | MUST be `false` for any error response. |
| `error.code` | `string` | REQUIRED | Machine-readable `UPPER_SNAKE_CASE` error identifier. |
| `error.message` | `string` | REQUIRED | Concise, agent-readable explanation of the failure. |
| `error.retryable` | `boolean` | OPTIONAL | Indicates whether retrying the call may succeed. Defaults to `false`. |
| `error.details` | `object` | OPTIONAL | Structured diagnostic context (for example, schema validation errors). MUST NOT expose secrets. |

#### Reserved Host Error Codes

Hosts MUST synthesize an error envelope using these reserved codes when failures occur outside or around handler logic:

| Code | When Returned |
| :--- | :--- |
| `INVALID_INPUT` | Tool arguments failed `inputSchema` validation before handler execution. |
| `MISSING_REQUIRED_VAR` | A `required: true` tool variable was not resolved in any active scope. |
| `INVALID_VAR_TYPE` | A resolved tool variable failed its declared datatype check. |
| `HANDLER_TIMEOUT` | Handler execution exceeded the host's configured timeout. |
| `HANDLER_EXECUTION_ERROR` | Uncaught exception or non-zero subprocess exit without a valid JSON error envelope. |
| `INVALID_OUTPUT` | Handler returned non-JSON output, an invalid envelope, or `data` violating `outputSchema`. |

### Diagnostics, Crashes, and Exit Codes

- Subprocess handlers MUST write diagnostic or debug logs to `stderr`, reserving `stdout` exclusively for the JSON output envelope.
- A subprocess handler SHOULD exit with code `0` when returning a valid JSON envelope (including structured domain errors with `"ok": false`) and non-zero only for unrecoverable runtime crashes.
- If a subprocess exits non-zero or throws an uncaught exception without producing a valid error envelope, the host MUST synthesize a `HANDLER_EXECUTION_ERROR` envelope and MAY attach truncated, sanitized `stderr` output in `error.details`.

## Example Handler (`handlers/get-current-weather.mjs`)

```js
import { fetchWeather } from "../modules/weather-client.mjs";

export async function execute(input, vars = {}) {
  try {
    const units = input.units ?? vars.defaultUnits ?? "metric";
    const data = await fetchWeather(input.city, units, {
      baseUrl: vars.apiBaseUrl,
      timeoutMs: vars.timeoutMs,
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "WEATHER_LOOKUP_FAILED",
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
```

## Related Specifications

- [Overall Specification](../README.md)
- [tools.json Manifest](./tools-json.md)
- [definitions/ Folder](./definitions.md)
- [modules/ Folder](./modules.md)
