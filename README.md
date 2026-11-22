# Tools Plugin Extension Specification

```text
Document: TOOLS-EXT-SPEC-001
Status: Draft (v0.1.0)
Category: Standalone Extension / Agent Plugin Specification
```

## Abstract

This specification defines a standalone, language-agnostic `tools/` extension format for agent plugins and standalone tool packages. It establishes a deterministic directory layout and manifest contract that cleanly separates tool metadata (`definitions/`), executable entrypoints (`handlers/`), shared internal code (`modules/`), and toolset registration (`tools.json`).

## Normative Requirements Language

The key words **"MUST"**, **"MUST NOT"**, **"REQUIRED"**, **"SHALL"**, **"SHALL NOT"**, **"SHOULD"**, **"SHOULD NOT"**, **"RECOMMENDED"**, **"MAY"**, and **"OPTIONAL"** in this specification are to be interpreted as described in RFC 2119 and RFC 8174.

## Design Goals

1. **Standalone Portability**: A `tools/` directory MUST function either as a standalone package loaded directly by an agent host or as an extension embedded inside a broader agent plugin specification.
2. **Separation of Concerns**: Declarative tool schemas (`definitions/`), executable entrypoints (`handlers/`), and reusable helper code (`modules/`) MUST reside in distinct directories so hosts can inspect schemas without executing code.
3. **Explicit Registration**: Tools MUST be explicitly declared in `tools.json`. Hosts MUST NOT implicitly expose unreferenced files as callable tools.
4. **Minimal Core, Extensible Surface**: The core format defines only the required structure and manifest fields, leaving runtime adapters and advanced capabilities open for future extension.

## Directory Layout

A compliant package or plugin places one or more named toolsets under a top-level `tools/` directory:

```text
tools/
└── <toolset-name>/
    ├── tools.json
    ├── definitions/
    │   └── <tool-name>.json
    ├── handlers/
    │   └── <tool-name>.<ext>
    └── modules/
        └── <shared-module>.<ext>
```

## Specification Index

| Component | Path Pattern | Specification Document |
| :--- | :--- | :--- |
| Top-level & Toolset Folders | `tools/<toolset-name>/` | [spec/tools.md](./spec/tools.md) |
| Toolset Manifest | `tools/<toolset-name>/tools.json` | [spec/tools-json.md](./spec/tools-json.md) |
| Tool Definitions Folder | `tools/<toolset-name>/definitions/` | [spec/definitions.md](./spec/definitions.md) |
| Tool Handlers Folder | `tools/<toolset-name>/handlers/` | [spec/handlers.md](./spec/handlers.md) |
| Shared Modules Folder | `tools/<toolset-name>/modules/` | [spec/modules.md](./spec/modules.md) |

## Lifecycle Overview

1. **Discovery**: The host scans `tools/` for immediate child directories containing a valid `tools.json` manifest.
2. **Validation**: The host validates `tools.json` and loads the referenced JSON schemas from `definitions/` without executing any code in `handlers/` or `modules/`.
3. **Registration**: Enabled tools are exposed to the agent runtime using their validated definition metadata, optionally namespaced by `<toolset-name>`.
4. **Variable Resolution**: Prior to execution, the host resolves declared tool variables (`vars`) across its active scopes (for example, `global` < `session` < `agent`), validates required keys and datatypes, and applies defaults.
5. **Invocation**: When the agent invokes a tool, the host validates input arguments against `inputSchema`, passes the validated `input` and resolved `vars` to the mapped entrypoint in `handlers/`, and returns the structured result.

## Standalone vs. Plugin Usage

- **Standalone Mode**: A repository or directory containing `tools/<toolset-name>/` MAY be mounted or referenced directly by a compatible agent host with no outer plugin manifest required.
- **Plugin Extension Mode**: An agent plugin specification MAY adopt this layout by placing `tools/` at the plugin root alongside existing plugin directories (such as `skills/`, `agents/`, or `hooks/`).

## Scope & Non-Goals (v0.1)

To keep the core specification minimal, portable, and language-agnostic, the following boundaries apply:

- **Request-Response Execution Only**: Each tool invocation accepts one validated input payload, returns one JSON envelope, and terminates. Persistent background workers, daemons, and streaming progress are out of scope for core `tools/` and belong in separate extensions if needed. Long-running external jobs SHOULD be modeled as start/poll tool pairs (for example, `start-job` and `get-job-status`).
- **No Built-In Storage or SQL Callback RPC**: Core `tools/` does not mandate host-provided SQLite, key-value, or object-storage callback APIs. Harnesses that provide state or object storage SHOULD provision scoped paths or endpoints (such as `stateDir`, `artifactDir`, or a local HTTP/socket URL) and pass them through resolved `vars`.

## Reference Example

A non-normative, runnable example toolset demonstrating `tools.json`, `definitions/`, `handlers/`, `modules/`, and resolved `vars` is available under [`examples/tools/weather/`](./examples/tools/weather/tools.json).
