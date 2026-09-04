import AOS from "aos";
import "aos/dist/aos.css";

export default defineNuxtPlugin((nuxtApp) => {
  if (typeof window !== "undefined") {
    nuxtApp.hook("app:mounted", () => {
      AOS.init({
        duration: 800,
        once: true,
        easing: "ease-out-cubic",
      });
    });
  }
});
