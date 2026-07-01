import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorPluginPerfCache',
  external: ['@monitor/transport'],
});
