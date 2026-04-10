import { env } from './env';

const DEFAULT_BASE_URL = 'http://localhost:5173';

function toUrl(input?: string | URL | null) {
  if (!input) return null;
  if (input instanceof URL) return input;

  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function resolveBaseUrl(origin?: string | URL | null) {
  const configuredUrl = toUrl(env.PUBLIC_BASE_URL);
  if (configuredUrl && !isLoopbackHost(configuredUrl.hostname)) {
    return configuredUrl.origin;
  }

  const requestUrl = toUrl(origin);
  if (requestUrl) return requestUrl.origin;

  return configuredUrl?.origin ?? DEFAULT_BASE_URL;
}

export function repairLoopbackUrl(target: string, origin?: string | URL | null) {
  const targetUrl = toUrl(target);
  const requestUrl = toUrl(origin);

  if (!targetUrl || !requestUrl) return target;
  if (!isLoopbackHost(targetUrl.hostname) || isLoopbackHost(requestUrl.hostname)) return targetUrl.toString();

  targetUrl.protocol = requestUrl.protocol;
  targetUrl.host = requestUrl.host;
  return targetUrl.toString();
}
