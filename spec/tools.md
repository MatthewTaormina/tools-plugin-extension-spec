# `tools/` Directory Specification

```text
Document: TOOLS-EXT-SPEC-002
Component: tools/ and tools/<toolset-name>/
Status: Draft (v0.1.0)
```

## Abstract

This document specifies the structure, naming conventions, and discovery rules for the top-level `tools/` directory and each arbitrary `<toolset-name>/` subdirectory contained within it.

## Normative Requirements Language

The key words **"MUST"**, **"MUST NOT"**, **"REQUIRED"**, **"SHALL"**, **"SHALL NOT"**, **"SHOULD"**, **"SHOULD NOT"**, **"RECOMMENDED"**, **"MAY"**, and **"OPTIONAL"** in this document are to be interpreted as described in RFC 2119 and RFC 8174.

## Top-Level `tools/` Directory

- The top-level container directory MUST be named `tools` (lowercase).
- `tools/` MUST contain one or more toolset subdirectories, each identified by an arbitrary `<toolset-name>`.
- `tools/` SHOULD NOT contain loose executable files or ungrouped tool definitions directly at its root.
- Hosts MUST ignore non-directory entries directly inside `tools/` unless explicitly configured otherwise.

```text
tools/
├── weather/
│   ├── tools.json
│   ├── definitions/
│   ├── handlers/
│   └── modules/
└── github-issues/
    ├── tools.json
    ├── definitions/
    ├── handlers/
    └── modules/
```

## Toolset Directory (`tools/<toolset-name>/`)

Each subdirectory under `tools/` represents a self-contained, cohesive set of related tools.

### Naming Rules

- `<toolset-name>` MAY be any arbitrary identifier chosen by the author, provided it conforms to lowercase kebab-case matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- `<toolset-name>` MUST match the `name` field declared in its `tools.json` manifest.
- `<toolset-name>` MUST be unique within a given `tools/` directory.

### Required and Optional Contents

Each `tools/<toolset-name>/` directory MUST conform to the following structure:

| Entry | Type | Requirement | Purpose |
| :--- | :--- | :--- | :--- |
| `tools.json` | File | REQUIRED | Manifest declaring toolset metadata and tool bindings ([tools-json.md](./tools-json.md)). |
| `definitions/` | Directory | REQUIRED | Declarative tool schema files ([definitions.md](./definitions.md)). |
| `handlers/` | Directory | REQUIRED | Executable tool handler entrypoints ([handlers.md](./handlers.md)). |
| `modules/` | Directory | OPTIONAL (RECOMMENDED) | Internal shared code imported by handlers ([modules.md](./modules.md)). |

### Isolation & Path Safety

- All paths referenced by `tools.json` MUST resolve within the containing `tools/<toolset-name>/` directory.
- Relative path traversal outside `<toolset-name>/` (such as `../`) MUST be rejected by the host during validation.
- A toolset SHOULD be self-contained so it can be copied, versioned, or distributed independently across hosts and plugins.

## Discovery Rules

1. A host scans immediate child directories of `tools/`.
2. A child directory is treated as a valid toolset candidate only if it contains a `tools.json` file.
3. If `tools.json` is malformed or fails validation, the host MUST reject that toolset and report a diagnostic error without silently loading partial tool bindings.
4. When multiple toolsets exist under `tools/`, hosts SHOULD support namespacing tool names (for example, `<toolset-name>.<tool-name>` or `<toolset-name>/<tool-name>`) to prevent collisions.

## Related Specifications

- [Overall Specification](../README.md)
- [tools.json Manifest](./tools-json.md)
- [definitions/ Folder](./definitions.md)
- [handlers/ Folder](./handlers.md)
- [modules/ Folder](./modules.md)
