import Lenis from "lenis";

export default defineNuxtPlugin((nuxtApp) => {
  if (typeof window !== "undefined") {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Default easing
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      // smoothTouch: false,
      // touchMultiplier: 2,
    });

    // lenis.on("scroll", (e) => {
    //   console.log(e);
    // });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    nuxtApp.provide("lenis", lenis);

    // Handle route changes
    nuxtApp.hook("page:finish", () => {
      lenis.scrollTo(0, { immediate: true });
    });
  }
});
