import { z } from "zod";
import { toAddress } from "~~/server/utils/mappers";

// Saved delivery addresses: user-scoped (RLS "own addresses" + explicit
// user_id scoping below, never from the client). The first address saved
// becomes the default automatically.

export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().min(1, "Phone is required").max(30),
  addressLine1: z.string().min(1, "Address is required").max(300),
  addressLine2: z.string().max(300).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postalCode: z.string().max(20).optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

function toRow(userId: string, input: AddressInput) {
  return {
    user_id: userId,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    phone: input.phone.trim(),
    address_line_1: input.addressLine1.trim(),
    address_line_2: input.addressLine2?.trim() || null,
    city: input.city.trim(),
    state: input.state.trim(),
    postal_code: input.postalCode?.trim() || null,
  };
}

export async function listAddresses(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toAddress);
}

export async function createAddress(supabase: any, userId: string, input: AddressInput) {
  const { count, error: countError } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countError) throw countError;

  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...toRow(userId, input), is_default: (count ?? 0) === 0 })
    .select()
    .single();
  if (error) throw error;
  return toAddress(data);
}

export async function updateAddress(supabase: any, userId: string, id: number, input: AddressInput) {
  const { data, error } = await supabase
    .from("addresses")
    .update({ ...toRow(userId, input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? toAddress(data) : null;
}

export async function removeAddress(supabase: any, userId: string, id: number) {
  const { data: current } = await supabase
    .from("addresses")
    .select("id, is_default")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!current) return false;

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;

  // Deleting the default promotes the newest remaining address.
  if (current.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase
        .from("addresses")
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq("id", next.id)
        .eq("user_id", userId);
    }
  }
  return true;
}

export async function setDefaultAddress(supabase: any, userId: string, id: number) {
  const { data: target } = await supabase
    .from("addresses")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return false;

  const { error: clearError } = await supabase
    .from("addresses")
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (clearError) throw clearError;

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}
