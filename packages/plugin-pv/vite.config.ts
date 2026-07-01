import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorPluginPv',
  external: ['@monitor/core', '@monitor/protocol', '@monitor/transport'],
});
