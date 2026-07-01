import {
  API_PATHS,
  createDefaultConfig,
  getReportBaseUrl,
  mergeMonitorConfig,
  type FilterFn,
  type MonitorConfig,
  type MonitorConfigPatch
} from "@monitor/config";
import { appendQueryParams, type QueryParams } from "@monitor/protocol";

type ApiKey = keyof typeof API_PATHS;
type RandomFn = () => number;
type SampleKey = "page" | "resource" | "ajax" | "api" | "error" | "metric";
export type SamplePatch = Partial<Record<SampleKey, number>> & {
  custom?: Record<string, number>;
};

const SAMPLE_KEYS: ReadonlySet<string> = new Set<SampleKey>([
  "page",
  "resource",
  "ajax",
  "api",
  "error",
  "metric"
]);

const DEFAULT_REMOTE_SAMPLING_KEY_MAP: Record<string, SampleKey> = {
  performance: "page",
  request: "api",
  log: "error",
  resource: "resource"
};

export type CoreConfig = MonitorConfig & {
  endpoints: Partial<Record<ApiKey, string>>;
  extensions: Record<string, string>;
  protocol?: string;
  webVersion?: string;
};

export type CoreConfigPatch = MonitorConfigPatch & {
  endpoints?: Partial<Record<ApiKey, string>>;
  extensions?: Record<string, string | undefined>;
  protocol?: string;
  webVersion?: string;
};

export interface CfgManagerOptions {
  random?: RandomFn;
  /** 远程采样配置的 key 映射：远程 key -> 本地 SampleKey */
  remoteSamplingKeyMap?: Record<string, SampleKey>;
}

export class CfgManager {
  private config: CoreConfig;
  private random: RandomFn;
  private readonly remoteSamplingKeyMap: Record<string, SampleKey>;
  private readonly firstProjectRequest = new Set<string>();
  private readonly sampleMap = new Map<string, SamplePatch>();
  private baseSampling: SamplePatch;

  constructor(patch: CoreConfigPatch = {}, options: CfgManagerOptions = {}) {
    this.random = options.random ?? Math.random;
    this.remoteSamplingKeyMap = options.remoteSamplingKeyMap ?? DEFAULT_REMOTE_SAMPLING_KEY_MAP;
    this.config = this.createConfig(patch);
    this.baseSampling = readSampling(this.config);
  }

  getConfig(): CoreConfig;
  getConfig<Key extends keyof CoreConfig>(key: Key): CoreConfig[Key];
  getConfig<Key extends keyof CoreConfig>(key?: Key): CoreConfig | CoreConfig[Key] {
    return cloneValue(key === undefined ? this.config : this.config[key]) as CoreConfig | CoreConfig[Key];
  }

  updateConfig(patch: CoreConfigPatch): CoreConfig {
    const previousProject = this.config.project;
    this.config = this.createConfig(patch, this.config);
    this.baseSampling = { ...this.baseSampling, ...readSamplingPatch(patch) };
    this.syncProjectSampling(previousProject);
    return cloneValue(this.config);
  }

  setConfig<Key extends keyof CoreConfig>(key: Key, value: CoreConfig[Key]): CoreConfig {
    return this.updateConfig({ [key]: value } as CoreConfigPatch);
  }

  getApiPath(key: ApiKey, extraQuery: QueryParams = {}): string {
    const path = this.config.endpoints[key] ?? API_PATHS[key];
    const query = this.createApiQuery(extraQuery);

    return appendQueryParams(`${this.config.reportBaseUrl}${path}`, query);
  }

  isSampled(key: SampleKey | string, project = this.config.project): boolean {
    const sample = this.getSampleValue(key, project);

    if (sample >= 1) {
      return true;
    }

    if (sample <= 0) {
      return false;
    }

    return this.random() < sample;
  }

  setRandom(random: RandomFn): void {
    this.random = random;
  }

  setExtension(key: string, value: string | undefined): void {
    if (value === undefined) {
      delete this.config.extensions[key];
      return;
    }

    this.config.extensions[key] = value;
  }

  getExtensions(): Record<string, string> {
    return { ...this.config.extensions };
  }

  addFilter(name: string, filter: FilterFn): void {
    this.config.filters = { ...this.config.filters, [name]: filter };
  }

  removeFilter(name: string): void {
    const { [name]: _removed, ...filters } = this.config.filters;
    this.config.filters = filters;
  }

  runFilter(name: string, value: unknown): boolean {
    try {
      return this.config.filters[name]?.(value) ?? true;
    } catch {
      return true;
    }
  }

  applyRemoteSampling(sampling: SamplePatch): void {
    const remapped = this.remapRemoteSampling(sampling);
    const projectSampling = {
      ...this.sampleMap.get(this.config.project),
      ...normalizeSampling(remapped),
      custom: {
        ...this.sampleMap.get(this.config.project)?.custom,
        ...remapped.custom
      }
    };

    this.sampleMap.set(this.config.project, projectSampling);
    this.applySampling(projectSampling);
  }

  getSampleMap(project = this.config.project): SamplePatch {
    return { ...this.sampleMap.get(project) };
  }

  private createConfig(patch: CoreConfigPatch, base?: CoreConfig): CoreConfig {
    const defaultConfig = base ?? this.createDefaultCoreConfig();
    const normalized = this.normalizePatch(patch, defaultConfig);
    const merged = mergeMonitorConfig(defaultConfig, normalized) as CoreConfig;

    merged.endpoints = { ...defaultConfig.endpoints, ...patch.endpoints };
    merged.extensions = applyExtensionPatch(defaultConfig.extensions, patch.extensions);
    merged.protocol = patch.protocol ?? defaultConfig.protocol;
    merged.webVersion = patch.webVersion ?? defaultConfig.webVersion;

    return merged;
  }

  private createDefaultCoreConfig(): CoreConfig {
    return {
      ...createDefaultConfig(),
      endpoints: {},
      extensions: {},
      protocol: "https:"
    };
  }

  private normalizePatch(patch: CoreConfigPatch, base: CoreConfig): MonitorConfigPatch {
    const { endpoints: _endpoints, extensions: _extensions, protocol, webVersion: _webVersion, ...config } = patch;
    const next = { ...config };

    if (patch.devMode !== undefined && patch.reportBaseUrl === undefined) {
      next.reportBaseUrl = getReportBaseUrl(patch.devMode);
    }

    if (protocol && patch.reportBaseUrl === undefined) {
      next.reportBaseUrl = base.reportBaseUrl.replace(/^https?:/, protocol);
    }

    return next;
  }

  private createApiQuery(extraQuery: QueryParams): QueryParams {
    const query: QueryParams = {
      project: this.config.project,
      ...this.config.extensions,
      ...extraQuery
    };

    if (this.config.webVersion) {
      query.webVersion = this.config.webVersion;
    }

    if (this.config.project && !this.firstProjectRequest.has(this.config.project)) {
      this.firstProjectRequest.add(this.config.project);
      query.st = 1;
    }

    return query;
  }

  private remapRemoteSampling(sampling: SamplePatch): SamplePatch {
    const remapped: SamplePatch = {};

    for (const [key, value] of Object.entries(sampling) as Array<[string, number | Record<string, number>]>) {
      if (key === "custom") {
        remapped.custom = { ...(value as Record<string, number>) };
        continue;
      }

      if (typeof value !== "number") {
        continue;
      }

      // 1. 通过映射表查找
      const mappedKey = this.remoteSamplingKeyMap[key];

      if (mappedKey !== undefined) {
        remapped[mappedKey] = value;
        continue;
      }

      // 2. 已知 SampleKey 直通
      if (SAMPLE_KEYS.has(key)) {
        remapped[key as SampleKey] = value;
        continue;
      }

      // 3. 未识别的 key 放入 custom 桶
      remapped.custom = { ...remapped.custom, [key]: value };
    }

    return remapped;
  }

  private getSampleValue(key: string, project: string): number {
    const projectSampling = this.sampleMap.get(project);

    // 先查远程采样
    const fromMap = projectSampling?.[key as SampleKey];
    if (fromMap !== undefined) return fromMap as number;

    // 自定义 key 从 custom 桶查找
    const fromCustom = projectSampling?.custom?.[key];
    if (fromCustom !== undefined) return fromCustom;

    // 标准 key 从 config 读取
    if (key === "api") return this.config.resource?.sampleApi ?? 1;

    const configSection = (this.config as unknown as Record<string, { sample?: number }>)[key];
    if (configSection?.sample !== undefined) return configSection.sample;

    return 1;
  }

  private syncProjectSampling(previousProject: string): void {
    if (previousProject === this.config.project) {
      return;
    }

    this.applySampling({
      ...this.baseSampling,
      ...this.sampleMap.get(this.config.project)
    });
  }

  private applySampling(sampling: SamplePatch): void {
    for (const [key, sample] of Object.entries(sampling)) {
      if (key === "custom" || sample === undefined) {
        continue;
      }

      const configSection = (this.config as unknown as Record<string, { sample?: number }>)[key];

      if (configSection) {
        configSection.sample = sample as number;
      }
    }
  }
}

function compactExtensions(
  extensions: Record<string, string | undefined> | undefined
): Record<string, string> {
  const compacted: Record<string, string> = {};

  for (const [key, value] of Object.entries(extensions ?? {})) {
    if (value !== undefined) {
      compacted[key] = value;
    }
  }

  return compacted;
}

function applyExtensionPatch(
  base: Record<string, string>,
  patch: Record<string, string | undefined> | undefined
): Record<string, string> {
  const next = { ...base };

  for (const [key, value] of Object.entries(patch ?? {})) {
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }

  return next;
}

function cloneValue<Value>(value: Value): Value {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as Value;
  }

  if (isPlainObject(value)) {
    const cloned: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
      cloned[key] = cloneValue(child);
    }

    return cloned as Value;
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.getPrototypeOf(value) === Object.prototype;
}

function readSampling(config: CoreConfig): SamplePatch {
  return {
    page: config.page.sample,
    resource: config.resource.sample,
    ajax: config.ajax.sample,
    error: config.error.sample,
    metric: config.metric.sample
  };
}

function readSamplingPatch(patch: CoreConfigPatch): SamplePatch {
  return normalizeSampling({
    page: patch.page?.sample,
    resource: patch.resource?.sample,
    ajax: patch.ajax?.sample,
    error: patch.error?.sample,
    metric: patch.metric?.sample
  });
}

function normalizeSampling(sampling: SamplePatch): SamplePatch {
  const normalized: SamplePatch = {};

  for (const [key, sample] of Object.entries(sampling) as Array<[SampleKey, number | undefined]>) {
    if (sample !== undefined) {
      normalized[key] = normalizeSample(sample);
    }
  }

  return normalized;
}

function normalizeSample(sample: number): number {
  if (!Number.isFinite(sample)) {
    return 1;
  }

  return Math.min(1, Math.max(0, sample));
}
