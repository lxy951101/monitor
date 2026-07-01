import {
  API_PATHS,
  createDefaultConfig,
  getReportBaseUrl,
  mergeMonitorConfig,
  type DeepPartial,
  type MonitorConfig,
  type MonitorConfigPatch
} from "@monitor/config";
import { appendQueryParams, type QueryParams } from "@monitor/protocol";

export interface MonitorCoreExtraConfig {
  webVersion?: string;
}

export type MonitorCoreConfig = MonitorConfig & MonitorCoreExtraConfig;
export type MonitorCoreConfigPatch = MonitorConfigPatch & DeepPartial<MonitorCoreExtraConfig>;
export type ApiPathKey = keyof typeof API_PATHS;
export type RandomSource = () => number;
export type ExtensionValue = string | number | boolean;
export type SamplingPatch = Record<string, number | undefined>;

export interface CfgManagerOptions {
  random?: RandomSource;
}

export class CfgManager {
  config: MonitorCoreConfig;

  private random: RandomSource;
  private readonly startedProjects = new Set<string>();
  private readonly extensions: Record<string, ExtensionValue> = {};
  private readonly samplingMap = new Map<string, Record<string, number>>();
  private baseSampling: Record<string, number>;

  constructor(config: MonitorCoreConfigPatch = {}, options: CfgManagerOptions = {}) {
    this.config = normalizeReportBaseUrl(createCoreConfig(config), config);
    this.random = options.random ?? Math.random;
    this.baseSampling = readSampling(this.config);
  }

  getConfig<Key extends keyof MonitorCoreConfig>(key: Key): MonitorCoreConfig[Key] {
    return this.config[key];
  }

  getAllConfig(): MonitorCoreConfig {
    return cloneConfig(this.config);
  }

  setConfig<Key extends keyof MonitorCoreConfig>(key: Key, value: MonitorCoreConfig[Key]): void {
    const previousProject = this.config.project;
    this.config = normalizeReportBaseUrl({ ...this.config, [key]: value }, { [key]: value });
    this.updateBaseSamplingFromValue(String(key), value);
    this.syncSamplingWhenProjectChanged(previousProject);
  }

  updateConfig(patch: MonitorCoreConfigPatch): void {
    const previousProject = this.config.project;
    this.config = normalizeReportBaseUrl(mergeCoreConfig(this.config, patch), patch);
    this.updateBaseSamplingFromPatch(patch);
    this.syncSamplingWhenProjectChanged(previousProject);
  }

  getApiPath(key: ApiPathKey | string, extraQuery: QueryParams = {}): string {
    const path = API_PATHS[key as ApiPathKey] ?? key;
    const url = joinUrl(this.config.reportBaseUrl, path);
    const project = this.config.project;
    const query: QueryParams = {
      project,
      webVersion: this.config.webVersion,
      ...this.consumeStartupQuery(project),
      ...extraQuery
    };

    return appendQueryParams(url, query);
  }

  setRandom(random: RandomSource): void {
    this.random = random;
  }

  isSampled(key: string): boolean {
    const sample = this.getSamplingRate(key);

    if (sample <= 0) {
      return false;
    }

    if (sample >= 1) {
      return true;
    }

    return this.random() < sample;
  }

  applyRemoteSampling(sampling: SamplingPatch): void {
    const project = this.config.project;
    const projectSampling = this.getProjectSampling(project);

    for (const [key, sample] of Object.entries(sampling)) {
      if (sample === undefined) {
        continue;
      }

      const normalizedSample = normalizeSample(sample);
      projectSampling[key] = normalizedSample;
      this.writeSamplingRate(key, normalizedSample);
    }
  }

  getSampleMap(project = this.config.project): Record<string, number> {
    return { ...(this.samplingMap.get(project) ?? {}) };
  }

  setExtension(key: string, value: ExtensionValue | undefined): void {
    if (value === undefined) {
      delete this.extensions[key];
      return;
    }

    this.extensions[key] = value;
  }

  getExtensions(): Record<string, ExtensionValue> {
    return { ...this.extensions };
  }

  clearExtensions(): void {
    for (const key of Object.keys(this.extensions)) {
      delete this.extensions[key];
    }
  }

  addFilter(name: string, filter: MonitorConfig["filters"][string]): void {
    this.config = {
      ...this.config,
      filters: {
        ...this.config.filters,
        [name]: filter
      }
    };
  }

  removeFilter(name: string): void {
    const { [name]: _removed, ...filters } = this.config.filters;
    this.config = { ...this.config, filters };
  }

  runFilter(name: string, value: unknown): boolean {
    const filter = this.config.filters[name];

    if (!filter) {
      return true;
    }

    try {
      return Boolean(filter(value));
    } catch {
      return true;
    }
  }

  private consumeStartupQuery(project: string): QueryParams {
    if (!project || this.startedProjects.has(project)) {
      return {};
    }

    this.startedProjects.add(project);
    return { st: 1 };
  }

  private getSamplingRate(key: string): number {
    const projectSampling = this.samplingMap.get(this.config.project);

    if (projectSampling?.[key] !== undefined) {
      return projectSampling[key];
    }

    return readSamplingRate(this.config, key) ?? 1;
  }

  private writeSamplingRate(key: string, sample: number): void {
    const target = this.config[key as keyof MonitorCoreConfig];

    if (hasSample(target)) {
      target.sample = sample;
    }
  }

  private getProjectSampling(project: string): Record<string, number> {
    let projectSampling = this.samplingMap.get(project);

    if (!projectSampling) {
      projectSampling = {};
      this.samplingMap.set(project, projectSampling);
    }

    return projectSampling;
  }

  private syncSamplingWhenProjectChanged(previousProject: string): void {
    if (previousProject === this.config.project) {
      return;
    }

    const projectSampling = this.samplingMap.get(this.config.project);

    for (const [key, sample] of Object.entries(this.baseSampling)) {
      this.writeSamplingRate(key, projectSampling?.[key] ?? sample);
    }
  }

  private updateBaseSamplingFromPatch(patch: MonitorCoreConfigPatch): void {
    for (const [key, value] of Object.entries(patch)) {
      this.updateBaseSamplingFromValue(key, value);
    }
  }

  private updateBaseSamplingFromValue(key: string, value: unknown): void {
    if (hasSample(value)) {
      this.baseSampling[key] = normalizeSample(value.sample);
    }
  }
}

function createCoreConfig(patch: MonitorCoreConfigPatch): MonitorCoreConfig {
  return {
    ...mergeMonitorConfig(createDefaultConfig(), patch),
    webVersion: patch.webVersion
  };
}

function mergeCoreConfig(
  base: MonitorCoreConfig,
  patch: MonitorCoreConfigPatch
): MonitorCoreConfig {
  const merged = mergeMonitorConfig(base, patch);
  return {
    ...merged,
    webVersion: patch.webVersion ?? base.webVersion
  };
}

function normalizeReportBaseUrl(
  config: MonitorCoreConfig,
  patch: MonitorCoreConfigPatch
): MonitorCoreConfig {
  if (patch.devMode === undefined || patch.reportBaseUrl !== undefined) {
    return config;
  }

  return {
    ...config,
    reportBaseUrl: getReportBaseUrl(Boolean(config.devMode))
  };
}

function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//iu.test(path)) {
    return path;
  }

  return `${baseUrl.replace(/\/+$/u, "")}/${path.replace(/^\/+/u, "")}`;
}

function readSampling(config: MonitorCoreConfig): Record<string, number> {
  const sampling: Record<string, number> = {};

  for (const [key, value] of Object.entries(config)) {
    if (hasSample(value)) {
      sampling[key] = normalizeSample(value.sample);
    }
  }

  return sampling;
}

function readSamplingRate(config: MonitorCoreConfig, key: string): number | undefined {
  const value = config[key as keyof MonitorCoreConfig];
  return hasSample(value) ? normalizeSample(value.sample) : undefined;
}

function hasSample(value: unknown): value is { sample: number } {
  return Boolean(value && typeof value === "object" && "sample" in value);
}

function normalizeSample(sample: number): number {
  if (!Number.isFinite(sample)) {
    return 1;
  }

  return Math.min(1, Math.max(0, sample));
}

function cloneConfig(config: MonitorCoreConfig): MonitorCoreConfig {
  return mergeCoreConfig(config, {});
}
