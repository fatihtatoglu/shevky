import content from "./content.js";
import view from "./view.js";

const API = {
  contents: content.contents,
  partials: view.partials,
  components: view.components,
  layouts: view.layouts,
  templates: view.templates,
};

export default API;
