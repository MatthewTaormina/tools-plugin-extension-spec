import { pathToFileURL } from "node:url";
import { fetchWeather, WeatherLookupError } from "../modules/weather-client.mjs";

export async function execute(input, vars = {}) {
  try {
    const units = input.units ?? vars.defaultUnits ?? "metric";
    const data = await fetchWeather(input.city, units, {
      baseUrl: vars.apiBaseUrl,
      timeoutMs: vars.timeoutMs,
    });
    return { ok: true, data };
  } catch (err) {
    if (err instanceof WeatherLookupError) {
      return {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          retryable: err.retryable,
        },
      };
    }
    return {
      ok: false,
      error: {
        code: "WEATHER_LOOKUP_FAILED",
        message: err instanceof Error ? err.message : String(err),
        retryable: false,
      },
    };
  }
}

async function runCli() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  const payload = raw ? JSON.parse(raw) : {};
  const result = await execute(payload.input ?? {}, payload.vars ?? {});
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
  });
}
