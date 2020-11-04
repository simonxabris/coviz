const resourceListMarker = "___REPLACE_THIS_WITH_RESOURCE_LIST_LATER";

export function replaceSwResourceList() {
  const ids = [];
  return {
    name: "create-service-worker-plugin",
    resolveId(id) {
      if (id !== "resources:") {
        return null;
      }

      return id;
    },
    load(id) {
      ids.push(id);
      if (id !== "resources:" ) {
        return null;
      }

      return `export default ${resourceListMarker};`
    },
    generateBundle(_outputOptions, bundle) {
      const resourceListJSON = JSON.stringify(Object.keys(bundle).filter(asset => asset.startsWith('sw') === false))

      for (const item of Object.values(bundle)) {
        if (!item.code) {
          continue;
        }
        item.code = item.code.replace(resourceListMarker, resourceListJSON);
      }
    }
  }
}