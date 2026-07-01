import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorPluginPage',
  external: ['@monitor/core', '@monitor/protocol', '@monitor/transport'],
});
