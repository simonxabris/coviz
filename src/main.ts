import App from "./App.svelte";
import swUrl from "sw-url:";

new App({
  target: document.body,
});

window.addEventListener("load", () => {
  navigator.serviceWorker.register(`/${swUrl}`);
});
