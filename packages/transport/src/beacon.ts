import { TransportError, type Transport } from "./types";

export interface BeaconNavigator {
 sendBeacon?: (url: string, data?: BodyInit | null) => boolean;
}

export interface BeaconTransportOptions {
 navigator?: BeaconNavigator;
}

export function createBeaconTransport(options: BeaconTransportOptions = {}): Transport {
 return {
  async send(request) {
   const navigatorLike = options.navigator ?? getGlobalNavigator();
   if (!navigatorLike?.sendBeacon) {
    throw new TransportError("sendBeacon is not available");
   }

   if (!navigatorLike.sendBeacon(request.url, request.body)) {
    throw new TransportError("sendBeacon returned false");
   }

   return { ok: true, status: 0 };
  }
 };
}

function getGlobalNavigator(): BeaconNavigator | undefined {
 return typeof globalThis.navigator === "undefined" ? undefined : globalThis.navigator;
}
