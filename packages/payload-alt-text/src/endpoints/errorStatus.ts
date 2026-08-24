/** Maps an `AltTextError` code to the HTTP status the endpoints return for it. */
export const errorStatus: Record<string, number> = {
  bad_request: 400,
  invalid_key: 500,
  no_content: 422,
  rate_limited: 429,
  server_error: 502,
  timeout: 504,
  unknown: 500,
}
