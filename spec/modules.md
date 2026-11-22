# `modules/` Directory Specification

```text
Document: TOOLS-EXT-SPEC-006
Component: tools/<toolset-name>/modules/
Status: Draft (v0.1.0)
```

## Abstract

This document specifies the `modules/` directory inside a toolset, which houses internal reusable libraries, API clients, and helper utilities shared by tool handlers.

## Normative Requirements Language

The key words **"MUST"**, **"MUST NOT"**, **"REQUIRED"**, **"SHALL"**, **"SHALL NOT"**, **"SHOULD"**, **"SHOULD NOT"**, **"RECOMMENDED"**, **"MAY"**, and **"OPTIONAL"** in this document are to be interpreted as described in RFC 2119 and RFC 8174.

## Purpose

The `modules/` directory provides a clean boundary for internal implementation code that supports one or more handlers without being exposed directly to the agent as a callable tool.

## Rules and Boundaries

1. **Non-Callable**: Hosts MUST NOT discover, register, or expose files under `modules/` as agent tools.
2. **Scoped Visibility**: Code in `modules/` SHOULD be imported only by handlers and other modules within the same `tools/<toolset-name>/` directory.
3. **No Manifest Coupling**: `tools.json` MUST NOT reference files inside `modules/` as `definition` or `handler` targets.
4. **Optional Presence**: If a toolset has no shared helper logic, `modules/` MAY be omitted or left empty.
5. **Subdirectory Freedom**: Authors MAY organize `modules/` into nested subdirectories (for example, `modules/clients/`, `modules/parsers/`) as needed by the implementation language.

## Recommended Responsibilities

Place code in `modules/` when it handles:

- External API clients and authentication helpers.
- Shared data normalization, formatting, or domain validation logic.
- Rate-limiting, retry, or caching utilities shared across multiple handlers.
- Language-specific types, constants, or error helpers.

Keep handler entrypoints in `handlers/` thin so that core business logic in `modules/` can be unit tested directly without invoking the agent host.

## Example Module (`modules/weather-client.mjs`)

```js
export async function fetchWeather(city, units = "metric", options = {}) {
  if (!city || typeof city !== "string") {
    throw new Error("A non-empty city string is required.");
  }

  const { baseUrl, timeoutMs = 5000 } = options;
  void baseUrl;
  void timeoutMs;

  return {
    city,
    temperature: units === "imperial" ? 54.5 : 12.5,
    conditions: "Partly cloudy",
  };
}
```

## Related Specifications

- [Overall Specification](../README.md)
- [tools/ Directory](./tools.md)
- [handlers/ Folder](./handlers.md)
