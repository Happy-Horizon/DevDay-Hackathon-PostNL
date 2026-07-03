"""Mock commerce backend for the PostNL Agentic Commerce preview.

Pure Python stdlib. Mirrors the *behaviour* of the real Agent Commerce Engine
backend (search / cart / order) so the agent flow can run fully offline.

Prices are stored in cents (ints) to avoid float rounding, exactly like a real
payment backend would.
"""
from __future__ import annotations

import json
import os
import time
import uuid
from pathlib import Path

BASE = Path(__file__).resolve().parent
CATALOG_PATH = BASE / "store" / "catalog.json"
PROFILE_PATH = BASE / "store" / "profile.json"
STATE_DIR = BASE / ".state"
STATE_PATH = STATE_DIR / "session.json"

# A payment URL is only valid for this long. The agent must hand it off to the
# human before it expires -- that is the whole trust model.
PAYMENT_TTL_SECONDS = 15 * 60


def euro(cents: int) -> str:
    return f"€{cents / 100:.2f}".replace(".", ",")


# --------------------------------------------------------------------------- #
# Catalog + state persistence
# --------------------------------------------------------------------------- #
def load_catalog() -> dict:
    with open(CATALOG_PATH, encoding="utf-8") as fh:
        return json.load(fh)


def load_profile() -> dict:
    """The user's saved profile. If 'known' is False, the agent must ask."""
    if PROFILE_PATH.exists():
        with open(PROFILE_PATH, encoding="utf-8") as fh:
            return json.load(fh)
    return {"known": False}


def _empty_state() -> dict:
    return {"cart": [], "orders": []}


def load_state() -> dict:
    if STATE_PATH.exists():
        with open(STATE_PATH, encoding="utf-8") as fh:
            return json.load(fh)
    return _empty_state()


def save_state(state: dict) -> None:
    STATE_DIR.mkdir(exist_ok=True)
    with open(STATE_PATH, "w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=2, ensure_ascii=False)


def reset_state() -> None:
    save_state(_empty_state())


# --------------------------------------------------------------------------- #
# Product helpers
# --------------------------------------------------------------------------- #
def find_product(slug: str) -> dict | None:
    for p in load_catalog()["products"]:
        if p["slug"] == slug:
            return p
    return None


def find_variant(product: dict, variant_id: str) -> dict | None:
    for v in product["variants"]:
        if v["id"] == variant_id:
            return v
    return None


def search(query: str, limit: int = 5) -> list[dict]:
    q = query.lower().strip()
    hits = []
    for p in load_catalog()["products"]:
        haystack = " ".join([p["title"], p["description"], " ".join(p["tags"])]).lower()
        if q in haystack:
            hits.append(_product_summary(p))
    return hits[:limit]


def list_products(limit: int = 10) -> list[dict]:
    return [_product_summary(p) for p in load_catalog()["products"][:limit]]


def _product_summary(p: dict) -> dict:
    prices = [v["price"] for v in p["variants"]]
    return {
        "slug": p["slug"],
        "title": p["title"],
        "from_price": min(prices),
        "from_price_display": euro(min(prices)),
        "in_stock": any(v["stock"] > 0 for v in p["variants"]),
        "tags": p["tags"],
    }


# --------------------------------------------------------------------------- #
# Cart
# --------------------------------------------------------------------------- #
def add_to_cart(slug: str, variant_id: str, qty: int = 1) -> dict:
    product = find_product(slug)
    if not product:
        return {"ok": False, "error": f"product '{slug}' bestaat niet"}
    variant = find_variant(product, variant_id)
    if not variant:
        options = ", ".join(v["id"] for v in product["variants"])
        return {"ok": False, "error": f"variant '{variant_id}' onbekend. Opties: {options}"}
    # GUARDRAIL: never add out-of-stock items.
    if variant["stock"] < qty:
        return {
            "ok": False,
            "error": f"onvoldoende voorraad voor '{variant['label']}' "
                     f"(gevraagd {qty}, beschikbaar {variant['stock']})",
        }
    state = load_state()
    state["cart"].append({
        "slug": slug,
        "title": product["title"],
        "variant_id": variant_id,
        "variant_label": variant["label"],
        "unit_price": variant["price"],
        "qty": qty,
    })
    save_state(state)
    return {"ok": True, "cart": get_cart()}


def get_cart() -> dict:
    state = load_state()
    items = state["cart"]
    total = sum(i["unit_price"] * i["qty"] for i in items)
    return {
        "items": items,
        "count": sum(i["qty"] for i in items),
        "total": total,
        "total_display": euro(total),
    }


# --------------------------------------------------------------------------- #
# Order + payment handoff
# --------------------------------------------------------------------------- #
def create_order(name: str, phone: str, city: str, address: str,
                 province: str = "") -> dict:
    cart = get_cart()
    if not cart["items"]:
        return {"ok": False, "error": "winkelwagen is leeg"}

    order_id = "PNL-" + uuid.uuid4().hex[:8].upper()
    created = time.time()
    order = {
        "order_id": order_id,
        "status": "awaiting_checkout",  # non-binding draft until the human taps
        "customer": {"name": name, "phone": phone},
        "shipping": {"city": city, "address": address, "province": province},
        "items": cart["items"],
        "total": cart["total"],
        "total_display": cart["total_display"],
        "created_at": created,
        # The agent CANNOT pay. It gets a PostNL Checkout link that only the
        # human can complete -- and completing it is BOTH approval and payment
        # in one action. That single link is the whole trust model.
        "checkout_url": f"https://checkout.postnl.example/co/{order_id}",
        "payment_url": f"https://checkout.postnl.example/co/{order_id}",  # alias
        "payment_expires_at": created + PAYMENT_TTL_SECONDS,
    }
    state = load_state()
    state["orders"].append(order)
    state["cart"] = []  # cart consumed into the order
    save_state(state)
    return {"ok": True, "order": order}


def payment_url_valid(order: dict) -> bool:
    return time.time() < order.get("payment_expires_at", 0)


def complete_checkout(order_id: str) -> dict:
    """The single human action in the PostNL app: approve AND pay at once.

    This is what one tap on the wrist deep-links into. Before this call the
    order is a non-binding draft (awaiting_checkout); after it, it's paid.
    """
    state = load_state()
    for o in state["orders"]:
        if o["order_id"] == order_id:
            if not payment_url_valid(o):
                return {"ok": False, "error": "checkout-link is verlopen"}
            o["status"] = "paid"
            o["tracking_code"] = "3S" + uuid.uuid4().hex[:9].upper()
            save_state(state)
            return {"ok": True, "order": o}
    return {"ok": False, "error": f"order '{order_id}' niet gevonden"}


# Backwards-compatible alias.
mark_paid = complete_checkout


def list_orders() -> list[dict]:
    return load_state()["orders"]


def promotions() -> list[dict]:
    return load_catalog()["promotions"]


def brand_story() -> str:
    return load_catalog()["store"]["brand_story"]
