import * as Crypto from "expo-crypto";

if (typeof global.crypto === "undefined") {
  global.crypto = {
    getRandomValues: (array: Uint8Array) => {
      return Crypto.getRandomValues(array);
    },
    subtle: {} as any,
  } as any;
}
