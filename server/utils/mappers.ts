// Map Supabase snake_case rows to the camelCase shapes the frontend
// already consumes (previously produced by Drizzle). Keeps pages untouched.

export function toCategory(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    isActive: row.is_active,
    parentId: row.parent_id,
    parent: row.parent ? toCategory(row.parent) : row.parent ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toVariant(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    sku: row.sku,
    price: String(row.price ?? "0"),
    comparePrice: row.compare_price != null ? String(row.compare_price) : null,
    inventoryQty: row.inventory_qty,
    weight: row.weight != null ? String(row.weight) : null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toProduct(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    categoryId: row.category_id,
    imageUrl: row.image_url,
    isActive: row.is_active,
    featured: row.featured,
    variants: (row.product_variants || row.variants || []).map(toVariant),
    category: row.categories || row.category ? toCategory(row.categories || row.category) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCartItem(row: any) {
  if (!row) return row;
  const variant = row.product_variants || row.variant;
  return {
    id: row.id,
    cartId: row.cart_id,
    productVariantId: row.variant_id,
    quantity: row.quantity,
    variant: variant
      ? {
          ...toVariant(variant),
          product: variant.products || variant.product
            ? {
                id: (variant.products || variant.product).id,
                name: (variant.products || variant.product).name,
                imageUrl: (variant.products || variant.product).image_url,
              }
            : undefined,
        }
      : undefined,
    createdAt: row.created_at,
  };
}

export function toAddress(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toOrderItem(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    orderId: row.order_id,
    productVariantId: row.variant_id,
    productName: row.product_name,
    variantName: row.variant_name,
    sku: row.sku,
    quantity: row.quantity,
    unitPrice: String(row.unit_price ?? "0"),
    totalPrice: String(row.total_price ?? "0"),
  };
}

export function toPayment(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    orderId: row.order_id,
    provider: row.provider,
    reference: row.reference,
    amount: String(row.amount ?? "0"),
    currency: row.currency,
    status: row.status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toOrder(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    userId: row.user_id,
    orderNumber: row.order_number,
    status: row.status,
    fulfillmentType: row.fulfillment_type,
    subtotal: String(row.subtotal ?? "0"),
    deliveryFee: String(row.delivery_fee ?? "0"),
    total: String(row.total ?? "0"),
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address,
    pickupTime: row.pickup_time,
    notes: row.notes,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    items: (row.order_items || row.items || []).map(toOrderItem),
    payments: (row.payments || []).map(toPayment),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
