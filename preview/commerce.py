#!/usr/bin/env python3
"""commerce.py — mock Agent Commerce Engine CLI (offline preview).

Mirrors the command surface of the real hackathon engine described in
docs/HACKATHON_BRIEFING_AGENTIC_COMMERCE.md, so the agent talks to it the same
way it would on the day:

    python3 commerce.py --store <url> search "kaars" --limit 5
    python3 commerce.py --store <url> get <slug>
    python3 commerce.py --store <url> add-cart <slug> --variant <variant-id>
    python3 commerce.py --store <url> cart
    python3 commerce.py --store <url> create-order --name ... --phone ... --city ... --address ...
    python3 commerce.py --store <url> orders

Extra helpers for the offline demo: `pay <order-id>` (simulates the human
completing checkout) and `reset` (clears cart + orders).

Every command prints JSON on stdout. Exit code 0 on success, 1 on a handled
error -- so the agent can branch on it.
"""
from __future__ import annotations

import argparse
import json
import sys

import store_backend as be


def emit(payload, ok: bool = True) -> None:
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    sys.exit(0 if ok else 1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Mock Agent Commerce Engine CLI")
    # --store is accepted for parity with the real CLI; ignored by the mock.
    parser.add_argument("--store", default="mock://local", help="store API base URL")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("search"); p.add_argument("query"); p.add_argument("--limit", type=int, default=5)
    p = sub.add_parser("list"); p.add_argument("--limit", type=int, default=10)
    p = sub.add_parser("get"); p.add_argument("slug")
    p = sub.add_parser("add-cart"); p.add_argument("slug"); p.add_argument("--variant", required=True); p.add_argument("--qty", type=int, default=1)
    sub.add_parser("cart")
    p = sub.add_parser("create-order")
    p.add_argument("--name", required=True); p.add_argument("--phone", required=True)
    p.add_argument("--city", required=True); p.add_argument("--address", required=True)
    p.add_argument("--province", default="")
    sub.add_parser("orders")
    sub.add_parser("profile")
    # `checkout` == the single human approve+pay action; `pay` kept as alias.
    p = sub.add_parser("checkout"); p.add_argument("order_id")
    p = sub.add_parser("pay"); p.add_argument("order_id")
    sub.add_parser("promotions")
    sub.add_parser("brand-story")
    sub.add_parser("reset")

    args = parser.parse_args()

    if args.cmd == "search":
        emit({"query": args.query, "results": be.search(args.query, args.limit)})
    elif args.cmd == "list":
        emit({"results": be.list_products(args.limit)})
    elif args.cmd == "get":
        product = be.find_product(args.slug)
        if not product:
            emit({"ok": False, "error": f"product '{args.slug}' niet gevonden"}, ok=False)
        emit(product)
    elif args.cmd == "add-cart":
        res = be.add_to_cart(args.slug, args.variant, args.qty)
        emit(res, ok=res["ok"])
    elif args.cmd == "cart":
        emit(be.get_cart())
    elif args.cmd == "create-order":
        res = be.create_order(args.name, args.phone, args.city, args.address, args.province)
        emit(res, ok=res["ok"])
    elif args.cmd == "orders":
        emit({"orders": be.list_orders()})
    elif args.cmd == "profile":
        emit(be.load_profile())
    elif args.cmd in ("checkout", "pay"):
        res = be.complete_checkout(args.order_id)
        emit(res, ok=res["ok"])
    elif args.cmd == "promotions":
        emit({"promotions": be.promotions()})
    elif args.cmd == "brand-story":
        emit({"brand_story": be.brand_story()})
    elif args.cmd == "reset":
        be.reset_state()
        emit({"ok": True, "message": "state gewist"})


if __name__ == "__main__":
    main()
