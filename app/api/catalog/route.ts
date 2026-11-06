import { connection, NextResponse } from "next/server";
import { getStorefrontProducts } from "../../../lib/medusa-products";

export const instant = false;

export async function GET() {
  await connection();

  const products = await getStorefrontProducts();

  return NextResponse.json(
    { products },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}