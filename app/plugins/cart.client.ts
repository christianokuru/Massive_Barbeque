// Load the saved cart once the page has fully hydrated (doing it earlier
// makes the client render differ from the server's — e.g. the cart
// badge), and keep every open tab in step: adding in one tab updates the
// others.
export default defineNuxtPlugin(() => {
  const cart = useCart();
  onNuxtReady(() => cart.hydrate());
  window.addEventListener("storage", (e) => {
    if (e.key === null || e.key === "mb:cart:v1") cart.hydrate();
  });
});
