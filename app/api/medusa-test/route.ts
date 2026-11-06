import { connection, NextResponse } from "next/server";
import { sdk } from "../../../lib/medusa";

export async function GET() {
  await connection();
  try {
    const { products, count } =
      await sdk.store.product.list({ limit: 1 });

    return NextResponse.json({
      connected: true,
      count,
      sampleProduct: products[0]
        ? {
            id: products[0].id,
            title: products[0].title,
            handle: products[0].handle,
          }
        : null,
    });
  } catch (error) {
    console.error("Medusa connection test failed:", error);

    return NextResponse.json(
      { connected: false, message: "Could not retrieve products from Medusa." },
      { status: 500 }
    );
  }
}