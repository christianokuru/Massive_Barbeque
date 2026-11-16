import { toast } from "vue-sonner";
import { assertGatewayUrl } from "~~/shared/utils/payments";
import { guestTokenForOrder } from "@/utils/guestOrderToken";

/** Start (or restart) payment for an existing unpaid order and send the
    buyer to the provider's checkout. The server prices from the order and
    checks access (session, or the guest pass saved on this device). */
export function usePayOrder() {
  const paying = ref(false);

  async function payNow(order: { id: string; paymentMethod?: string; customerEmail?: string; customerName?: string; customerPhone?: string }) {
    if (paying.value) return;
    paying.value = true;
    try {
      const path = order.paymentMethod === "flutterwave"
        ? "/api/payments/flutterwave/initialize"
        : "/api/payments/paystack/initialize";
      const r = await $fetch<{ authorization_url?: string; link?: string }>(path, {
        method: "POST",
        body: {
          email: order.customerEmail,
          orderId: order.id,
          guestToken: guestTokenForOrder(order.id),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
        },
      });
      const url = r.authorization_url ?? r.link;
      if (!url) throw new Error("Payment could not be started.");
      window.location.href = assertGatewayUrl(url);
      // Leave `paying` on: the page is navigating away.
      return;
    } catch (e: any) {
      toast.error(
        e?.message === "bad-gateway-url"
          ? "Payment could not be started. Try again."
          : e?.data?.statusMessage || e?.message || "Could not start payment.",
      );
    }
    paying.value = false;
  }

  return { paying, payNow };
}
