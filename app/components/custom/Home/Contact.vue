<script setup>
import { z } from "zod";
import { useZod } from "~/composables/useZod";
import { toast } from "vue-sonner";

const contactSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  brand: z.string().min(1, "Brand name is required"),
  message: z
    .string()
    .min(1, "Message is required")
    .min(10, "Message must be at least 10 characters"),
});

const { errors, validate, clearFieldError } = useZod(contactSchema);

const formData = ref({
  name: "",
  email: "",
  brand: "",
  message: "",
});

const isLoading = ref(false);

const handleSubmit = async () => {
  if (!validate(formData.value)) {
    toast.error("Please fix the errors in the form");
    return;
  }

  isLoading.value = true;

  try {
    const response = await $fetch("/api/contact", {
      method: "POST",
      body: formData.value,
    });

    console.log("Form submitted successfully:", response);

    // Show success toast
    toast.success("Message sent successfully!", {
      description: "We'll get back to you within 24 hours.",
    });

    // Reset form on success
    formData.value = { name: "", email: "", brand: "", message: "" };
  } catch (error) {
    console.error("Submission failed:", error);

    // Show error toast
    toast.error("Failed to send message", {
      description: "Please try again or contact us directly via email.",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <section id="contact" class="py-32 px-6 lg:px-12 bg-[#fafaf9]">
    <div class="max-w-7xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-16 lg:gap-24">
        <div data-aos="fade-right">
          <p
            class="text-xs uppercase tracking-[0.4em] text-[#D4AF37] mb-6"
            style="font-family: &quot;Inter&quot;, sans-serif"
          >
            Let's Begin
          </p>

          <h2
            class="text-5xl md:text-6xl lg:text-7xl mb-8 tracking-tight"
            style="
              font-family: &quot;Cormorant Garamond&quot;, serif;
              font-weight: 300;
              line-height: 1.1;
            "
          >
            Your Vision
            <br />
            <span class="italic" style="font-weight: 400"
              >Deserves Excellence</span
            >
          </h2>

          <p
            class="text-xs md:text-base text-gray-600 leading-relaxed mb-12"
            style="font-family: &quot;Inter&quot;, sans-serif; font-weight: 300"
          >
            Whether you're launching a new brand or reimagining an established
            house, we approach each partnership with the same commitment to
            perfection. Share your vision with us, and let's create something
            extraordinary together.
          </p>

          <div class="space-y-6">
            <div>
              <p
                class="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2"
                style="font-family: &quot;Inter&quot;, sans-serif"
              >
                Email
              </p>
              <a
                href="mailto:okuruchristian@gmail.com"
                class="text-underline text-xl hover:text-[#D4AF37] transition-colors"
                style="
                  font-family: &quot;Cormorant Garamond&quot;, serif;
                  font-weight: 400;
                "
              >
                okuruchristian@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div data-aos="fade-left">
          <h3
            class="text-2xl font-light text-neutral-900 mb-8"
            style="
              font-family: &quot;Cormorant Garamond&quot;, serif;
              font-weight: 400;
            "
          >
            Tell Us About Your Brand
          </h3>

          <form @submit.prevent="handleSubmit" class="space-y-8">
            <div>
              <label
                for="name"
                class="block text-xs uppercase tracking-[0.3em] mb-3"
                style="
                  font-family: &quot;Inter&quot;, sans-serif;
                  font-weight: 500;
                "
              >
                Your Name
              </label>
              <input
                type="text"
                id="name"
                v-model="formData.name"
                @input="clearFieldError('name')"
                :class="[
                  'w-full border-b bg-transparent py-3 focus:outline-none transition-colors text-lg',
                  errors.name
                    ? 'border-red-500'
                    : 'border-gray-300 focus:border-[#D4AF37]',
                ]"
                style="
                  font-family: &quot;Inter&quot;, sans-serif;
                  font-weight: 300;
                "
              />
              <p
                v-if="errors.name"
                class="text-red-500 text-sm mt-2"
                style="font-family: &quot;Inter&quot;, sans-serif"
              >
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label
                for="email"
                class="block text-xs uppercase tracking-[0.3em] mb-3"
                style="
                  font-family: &quot;Inter&quot;, sans-serif;
                  font-weight: 500;
                "
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                v-model="formData.email"
                @input="clearFieldError('email')"
                :class="[
                  'w-full border-b bg-transparent py-3 focus:outline-none transition-colors text-lg',
                  errors.email
                    ? 'border-red-500'
                    : 'border-gray-300 focus:border-[#D4AF37]',
                ]"
                style="
                  font-family: &quot;Inter&quot;, sans-serif;
                  font-weight: 300;
                "
              />
              <p
                v-if="errors.email"
                class="text-red-500 text-sm mt-2"
                style="font-family: &quot;Inter&quot;, sans-serif"
              >
                {{ errors.email }}
              </p>
            </div>

            <div>
              <label
                for="brand"
                class="block text-xs uppercase tracking-[0.3em] mb-3"
                style="
                  font-family: &quot;Inter&quot;, sans-serif;
                  font-weight: 500;
                "
              >
                Brand Name
              </label>
              <input
                type="text"
                id="brand"
                v-model="formData.brand"
                @input="clearFieldError('brand')"
                :class="[
                  'w-full border-b bg-transparent py-3 focus:outline-none transition-colors text-lg',
                  errors.brand
                    ? 'border-red-500'
                    : 'border-gray-300 focus:border-[#D4AF37]',
                ]"
                style="
                  font-family: &quot;Inter&quot;, sans-serif;
                  font-weight: 300;
                "
              />
              <p
                v-if="errors.brand"
                class="text-red-500 text-sm mt-2"
                style="font-family: &quot;Inter&quot;, sans-serif"
              >
                {{ errors.brand }}
              </p>
            </div>

            <div>
              <label
                for="message"
                class="block text-xs uppercase tracking-[0.3em] mb-3"
                style="
                  font-family: &quot;Inter&quot;, sans-serif;
                  font-weight: 500;
                "
              >
                Your Vision
              </label>
              <p
                class="text-sm text-gray-400 mb-2"
                style="
                  font-family: &quot;Inter&quot;, sans-serif;
                  font-weight: 500;
                "
              >
                What story do you want your digital presence to tell?
              </p>
              <textarea
                id="message"
                v-model="formData.message"
                @input="clearFieldError('message')"
                rows="5"
                :class="[
                  'w-full border-b bg-transparent py-3 focus:outline-none transition-colors resize-none text-lg',
                  errors.message
                    ? 'border-red-500'
                    : 'border-gray-300 focus:border-[#D4AF37]',
                ]"
                style="
                  font-family: &quot;Inter&quot;, sans-serif;
                  font-weight: 300;
                "
              />
              <p
                v-if="errors.message"
                class="text-red-500 text-sm mt-2"
                style="font-family: &quot;Inter&quot;, sans-serif"
              >
                {{ errors.message }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              :class="[
                'w-full py-5 text-white text-sm uppercase tracking-[0.3em] transition-all duration-200 flex items-center justify-center gap-3',
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black hover:scale-105 active:scale-95',
              ]"
              style="
                font-family: &quot;Inter&quot;, sans-serif;
                font-weight: 500;
              "
            >
              <svg
                v-if="isLoading"
                class="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {{ isLoading ? "Sending..." : "Begin the Conversation" }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
