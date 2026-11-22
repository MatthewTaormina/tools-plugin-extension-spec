const SAMPLE_WEATHER = {
  toronto: { tempC: 12.5, conditions: "Partly cloudy" },
  london: { tempC: 9.0, conditions: "Light rain" },
  tokyo: { tempC: 18.0, conditions: "Clear" },
};

export class WeatherLookupError extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.name = "WeatherLookupError";
    this.code = code;
    this.retryable = retryable;
  }
}

export async function fetchWeather(city, units = "metric", options = {}) {
  if (!city || typeof city !== "string") {
    throw new WeatherLookupError("INVALID_CITY", "A non-empty city string is required.");
  }

  // Reference example stub: uses deterministic sample data instead of live HTTP calls.
  const { baseUrl, timeoutMs = 5000 } = options;
  void baseUrl;
  void timeoutMs;

  const record = SAMPLE_WEATHER[city.trim().toLowerCase()];
  if (!record) {
    throw new WeatherLookupError(
      "CITY_NOT_FOUND",
      `No weather record found for city '${city}'.`,
      false,
    );
  }

  const temperature =
    units === "imperial"
      ? Number(((record.tempC * 9) / 5 + 32).toFixed(1))
      : record.tempC;

  return {
    city: city.trim(),
    units,
    temperature,
    conditions: record.conditions,
  };
}
