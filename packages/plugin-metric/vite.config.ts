import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorPluginMetric',
  external: ['@monitor/core', '@monitor/protocol', '@monitor/transport'],
});
