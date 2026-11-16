<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import { z } from "zod";

useSeoMeta({
  title: "Contact",
  description: "Reach Massive Barbeque in Lagos — bulk and party orders, catering enquiries and support. Send us a message.",
});

const channels = [
  { icon: "mail", label: "Email", value: "info@massivebarbeque.com", href: "mailto:info@massivebarbeque.com" },
  { icon: "location_on", label: "Find us", value: "Lagos, Nigeria" },
  { icon: "schedule", label: "Hours", value: "Open daily · delivery across Lagos" },
];

// Same limits as POST /api/contact, checked here first for instant feedback.
const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100, "Name is too long."),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  brand: z.string().trim().min(1, "Tell us who you are or your company.").max(200, "That's too long."),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(2000, "Keep it under 2,000 characters."),
});
type Field = keyof z.infer<typeof schema>;

const form = reactive({ name: "", email: "", brand: "", message: "", company: "" });
const errors = reactive<Partial<Record<Field, string>>>({});
const sending = ref(false);
const sent = ref(false);
const failure = ref("");

function clearError(f: Field) {
  delete errors[f];
}

async function submit() {
  failure.value = "";
  for (const k of Object.keys(errors) as Field[]) delete errors[k];
  const parsed = schema.safeParse(form);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const f = issue.path[0] as Field;
      if (!errors[f]) errors[f] = issue.message;
    }
    return;
  }
  sending.value = true;
  try {
    await $fetch("/api/contact", { method: "POST", body: { ...parsed.data, company: form.company || undefined } });
    sent.value = true;
    Object.assign(form, { name: "", email: "", brand: "", message: "" });
  } catch (e: any) {
    const issues = e?.data?.data?.issues as Array<{ path: string; message: string }> | undefined;
    if (issues?.length) for (const i of issues) errors[i.path as Field] ??= i.message;
    else failure.value = e?.data?.statusMessage || "Your message couldn't be sent. Please try again or email us.";
  } finally {
    sending.value = false;
  }
}

const inputClass =
  "w-full rounded-xl border bg-card px-4 py-3 outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pt-24 pb-20 sm:pt-28 md:px-6">
    <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">Contact</p>
    <h1 class="m3-display-sm mt-3 md:m3-display-md">Talk to us</h1>
    <p class="m3-body-lg mt-4 max-w-2xl text-muted-foreground">
      Bulk and party orders, catering, feedback, or a question about an order — send a message and we'll get back to you.
      For food right now, the <NuxtLink to="/menu" class="font-medium text-primary hover:underline">menu</NuxtLink> is the fastest route.
    </p>

    <div class="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
      <!-- Form -->
      <section class="rounded-3xl border border-border bg-card p-5 sm:p-8" aria-label="Send us a message">
        <div v-if="sent" class="py-8 text-center" role="status">
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <M3Icon name="check" :size="28" />
          </span>
          <h2 class="m3-headline-sm mt-5">Message sent</h2>
          <p class="m3-body-md mt-2 text-muted-foreground">Thanks for reaching out — we'll reply to your email soon.</p>
          <button type="button" class="mt-6 rounded-full border border-border px-6 py-2.5 text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60" @click="sent = false">
            Send another
          </button>
        </div>

        <form v-else novalidate class="grid gap-5" @submit.prevent="submit">
          <div class="grid gap-5 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1.5 block text-sm font-medium">Your name</span>
              <input v-model="form.name" autocomplete="name" maxlength="100" :aria-invalid="!!errors.name" :class="[inputClass, errors.name ? 'border-destructive' : 'border-border']" @input="clearError('name')" />
              <span v-if="errors.name" class="mt-1 block text-xs text-destructive">{{ errors.name }}</span>
            </label>
            <label class="block">
              <span class="mb-1.5 block text-sm font-medium">Email</span>
              <input v-model="form.email" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="you@example.com" :aria-invalid="!!errors.email" :class="[inputClass, errors.email ? 'border-destructive' : 'border-border']" @input="clearError('email')" />
              <span v-if="errors.email" class="mt-1 block text-xs text-destructive">{{ errors.email }}</span>
            </label>
          </div>
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium">Company or occasion</span>
            <input v-model="form.brand" maxlength="200" placeholder="e.g. Birthday party, Acme Ltd, or just “personal”" :aria-invalid="!!errors.brand" :class="[inputClass, errors.brand ? 'border-destructive' : 'border-border']" @input="clearError('brand')" />
            <span v-if="errors.brand" class="mt-1 block text-xs text-destructive">{{ errors.brand }}</span>
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium">Message</span>
            <textarea v-model="form.message" rows="5" maxlength="2000" placeholder="How many people, which date, what you'd like…" :aria-invalid="!!errors.message" :class="[inputClass, errors.message ? 'border-destructive' : 'border-border']" @input="clearError('message')" />
            <span class="mt-1 flex justify-between text-xs">
              <span class="text-destructive">{{ errors.message }}</span>
              <span class="text-muted-foreground tabular-nums">{{ form.message.length }}/2000</span>
            </span>
          </label>
          <!-- Spam trap: hidden from people, bots fill it in. -->
          <input v-model="form.company" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" class="absolute -left-[9999px] h-0 w-0 opacity-0" />

          <p v-if="failure" role="alert" class="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{{ failure }}</p>
          <button type="submit" :disabled="sending" class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 sm:justify-self-start">
            <M3Icon name="send" :size="16" />
            {{ sending ? "Sending…" : "Send message" }}
          </button>
        </form>
      </section>

      <!-- Channels -->
      <aside class="grid gap-3">
        <div v-for="c in channels" :key="c.label" class="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <M3Icon :name="c.icon" :size="20" />
          </span>
          <div class="min-w-0">
            <p class="text-sm text-muted-foreground">{{ c.label }}</p>
            <a v-if="c.href" :href="c.href" class="font-semibold break-all text-primary hover:underline">{{ c.value }}</a>
            <p v-else class="font-semibold">{{ c.value }}</p>
          </div>
        </div>
        <NuxtLink to="/track" class="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary">
          <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <M3Icon name="receipt_long" :size="20" />
          </span>
          <div>
            <p class="font-semibold">Where's my order?</p>
            <p class="text-sm text-muted-foreground">Check its status yourself</p>
          </div>
          <M3Icon name="chevron_right" :size="20" class="ml-auto text-muted-foreground" />
        </NuxtLink>
      </aside>
    </div>
  </div>
</template>
