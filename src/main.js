import { createApp } from "./app/createApp.js";

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  createApp({ document, window }).init();
});
