import { readFileContent, writeFileContent } from "./openclaw";

export interface OpenClawConfig {
  [key: string]: unknown;
}

export async function readConfig(): Promise<OpenClawConfig> {
  const raw = await readFileContent("openclaw.json");
  return JSON.parse(raw) as OpenClawConfig;
}

export async function writeConfig(config: OpenClawConfig): Promise<void> {
  const content = JSON.stringify(config, null, 2);
  await writeFileContent("openclaw.json", content);
}
