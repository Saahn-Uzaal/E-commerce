export const CART_STORAGE_KEY = "gettsay-cart";
export const CART_UPDATED_EVENT = "gettsay-cart-updated";

function isBrowser() {
  return typeof window !== "undefined";
}

export function readCart() {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      }))
      .filter((item) => Number.isInteger(item.productId) && item.productId > 0 && item.quantity > 0);
  } catch {
    return [];
  }
}

export function writeCart(items) {
  if (!isBrowser()) {
    return [];
  }

  const normalizedItems = items
    .map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    }))
    .filter((item) => Number.isInteger(item.productId) && item.productId > 0 && item.quantity > 0);

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedItems));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: normalizedItems }));
  return normalizedItems;
}

export function addProductToCart(productId, quantity = 1) {
  const cart = readCart();
  const existingItem = cart.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
    return writeCart(cart);
  }

  return writeCart([...cart, { productId, quantity }]);
}

export function setCartItemQuantity(productId, quantity) {
  const cart = readCart();

  if (quantity <= 0) {
    return writeCart(cart.filter((item) => item.productId !== productId));
  }

  return writeCart(
    cart.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
  );
}

export function removeProductFromCart(productId) {
  return writeCart(readCart().filter((item) => item.productId !== productId));
}

export function clearCart() {
  return writeCart([]);
}

export function countCartItems(items = readCart()) {
  return items.reduce((total, item) => total + item.quantity, 0);
}
