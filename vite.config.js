import dts from "vite-plugin-dts";
import { resolve } from "path"
import { defineConfig } from "vite"

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "lib/media-device-wrapper.ts"),
      name: "MediaDeviceWrapper",
      // the proper extensions will be added
      fileName: "media-device-wrapper",
    },
  },
  plugins: [
    dts({ include: ["lib"] }),
  ]
})