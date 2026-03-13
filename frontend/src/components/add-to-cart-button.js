"use client";

import { useState } from "react";
import { addProductToCart } from "@/lib/cart";

export function AddToCartButton({ productId, label = "Thêm vào giỏ", className = "" }) {
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addProductToCart(productId, 1);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1400);
  }

  return (
    <button
      className={`button button--secondary ${className}`.trim()}
      onClick={handleAddToCart}
      type="button"
    >
      {added ? "Đã thêm" : label}
    </button>
  );
}
