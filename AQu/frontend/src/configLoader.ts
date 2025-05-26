import toml from 'toml';

export async function loadBackendUrl(): Promise<string> {
  const response = await fetch('/config.toml');
  const text = await response.text();
  const config = toml.parse(text);
  if (config.backend && config.backend.url) {
    return config.backend.url;
  }
  throw new Error('Backend URL not found in config.toml');
} 