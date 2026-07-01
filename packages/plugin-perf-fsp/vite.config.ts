import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorPluginPerfFsp',
  external: ['@monitor/core', '@monitor/protocol', '@monitor/transport'],
});
