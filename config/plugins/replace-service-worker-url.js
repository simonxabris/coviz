const swMarker = "___REPLACE_THIS_SW_URL";

export function replaceServiceWorkerUrl() {
  return {
    name: "create-service-worker-plugin",
    resolveId(id) {
      if (id !== "sw-url:") {
        return null;
      }

      return id;
    },
    load(id) {
      if (id !== "sw-url:" ) {
        return null;
      }

      return `export default ${swMarker};`
    },
    generateBundle(_outputOptions, bundle) {
      const serviceWorker = Object.keys(bundle).find(asset => asset.startsWith('sw'));

      console.log('sw url: ', serviceWorker);

      for (const item of Object.values(bundle)) {
        if (!item.code) {
          continue;
        }
        item.code = item.code.replace(swMarker, `"${serviceWorker}"`);
      }
    }
  }
}