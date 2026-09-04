import { z } from 'zod';
import { db, schema } from '~~/server/db';
import { eq } from 'drizzle-orm';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  variants: z.array(z.object({
    name: z.string().min(1, 'Variant name is required'),
    sku: z.string().min(1, 'SKU is required'),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
    comparePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    inventoryQty: z.number().int().min(0).default(0),
    weight: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    isActive: z.boolean().default(true),
  })).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // TODO: Add proper admin authentication middleware
    const body = await readValidatedBody(event, productSchema.parse);

    // Create product
    const [newProduct] = await db.insert(schema.products).values({
      name: body.name,
      slug: body.slug,
      description: body.description,
      categoryId: body.categoryId,
      imageUrl: body.imageUrl,
      isActive: body.isActive,
      featured: body.featured,
    }).returning();

    // Create variants if provided
    if (body.variants && body.variants.length > 0) {
      const variantsData = body.variants.map(variant => ({
        productId: newProduct.id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price,
        comparePrice: variant.comparePrice ?? null,
        inventoryQty: variant.inventoryQty,
        weight: variant.weight ?? null,
        isActive: variant.isActive,
      }));

      await db.insert(schema.productVariants).values(variantsData);
    }

    // Fetch the complete product with variants
    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, newProduct.id),
      with: {
        variants: true,
        category: true,
      },
    });

    return { 
      success: true, 
      product 
    };
  } catch (error: any) {
    console.error('Product creation error:', error);
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create product',
    });
  }
});