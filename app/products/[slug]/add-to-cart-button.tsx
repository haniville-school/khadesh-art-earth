"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";

type Props = {
  productId: string;
  vendorId: string;
  title: string;
  price: number;
  image: string | null;
  stock: number;
};

export default function AddToCartButton(props: Props) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({
      productId: props.productId,
      vendorId: props.vendorId,
      title: props.title,
      price: props.price,
      image: props.image,
      stock: props.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={props.stock === 0}
        className="w-full bg-[var(--color-moss)] text-white rounded-sm px-4 py-3 hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
      >
        {props.stock === 0 ? "Out of stock" : added ? "Added" : "Add to cart"}
      </button>
      {added && (
        <button
          onClick={() => router.push("/cart")}
          className="w-full border border-[var(--color-line)] rounded-sm px-4 py-2 text-sm hover:border-[var(--color-plum)] hover:text-[var(--color-plum)] transition-colors"
        >
          View cart
        </button>
      )}
    </div>
  );
}