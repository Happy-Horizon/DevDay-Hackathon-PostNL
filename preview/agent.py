#!/usr/bin/env python3
"""agent.py — the offline Agentic Commerce agent loop.

This is the piece a hackathon team actually designs. On the day it runs inside
OpenClaw with Gemini doing the reasoning; here the reasoning is deterministic
so the whole flow runs offline and always produces the same demo.

Refined model (what this preview argues for):

    intent → discovery → propose → pick → cart → address(from profile)
           → create DRAFT order
           → ONE HUMAN MOMENT on the wrist: PostNL Checkout, one tap = approve + pay
           → tracking

The agent runs autonomously all the way to the money. There is exactly ONE
unavoidable human action — completing PostNL Checkout — and the address is only
asked when it isn't already known. It talks to the store ONLY through
commerce.py (subprocess), like the real OpenClaw skill. No webshop UI is opened.

Usage:
    python3 agent.py                       # interactive, one wrist moment
    python3 agent.py --auto                # non-interactive, auto-complete
    python3 agent.py --auto --decline      # human dismisses checkout → clean abort
    python3 agent.py --auto --scenario oos # out-of-stock guardrail
    python3 agent.py --auto --unknown-address  # show the only extra question
    python3 agent.py --budget 30 --intent "iets met thee"
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

import garmin
import store_backend as be

HERE = Path(__file__).resolve().parent
STORE_URL = "https://shop-demo.devday.postnl.local/api/v1"  # cosmetic, mock ignores it

BOLD = "\033[1m"; DIM = "\033[2m"; CYAN = "\033[36m"; GREEN = "\033[32m"
RED = "\033[31m"; YEL = "\033[33m"; RESET = "\033[0m"


def say(who: str, msg: str) -> None:
    color = {"agent": CYAN, "user": GREEN, "sys": DIM, "postnl": YEL}.get(who, "")
    tag = {"agent": "🤖 agent", "user": "🧑 klant", "sys": "   ·", "postnl": "📦 PostNL"}[who]
    print(f"{color}{BOLD}{tag}{RESET}{color}  {msg}{RESET}")


def commerce(*args: str) -> tuple[dict, bool]:
    """Call the commerce CLI as the real agent would. Returns (json, ok)."""
    cmd = [sys.executable, str(HERE / "commerce.py"), "--store", STORE_URL, *args]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    ok = proc.returncode == 0
    try:
        data = json.loads(proc.stdout or "{}")
    except json.JSONDecodeError:
        data = {"error": proc.stderr.strip() or "no output"}
    time.sleep(0.15)  # let the demo breathe
    return data, ok


def pause(auto: bool, secs: float = 0.5) -> None:
    time.sleep(0.1 if auto else secs)


def run(intent: str, budget_eur: int, auto: bool, decline: bool,
        scenario: str, unknown_address: bool) -> int:
    budget = budget_eur * 100
    commerce("reset")  # clean slate for the demo

    print(_rule("1 · INTENTIE"))
    say("user", f"\"{intent}\" — budget rond de €{budget_eur}.")
    say("agent", f"Helder. Ik regel alles zelf tot aan het betalen — dáár tik jij één keer.")
    pause(auto)

    print(_rule("2 · DISCOVERY  (commerce.py search)"))
    keyword = _keyword(intent)
    say("sys", f"$ python3 commerce.py search \"{keyword}\"")
    res, ok = commerce("search", keyword, "--limit", "5")
    hits = res.get("results", []) if ok else []
    if not hits:
        res, ok = commerce("list", "--limit", "5")
        hits = res.get("results", [])
    say("agent", f"{len(hits)} resultaten. Ik filter op voorraad en prijs per variant.")
    pause(auto)

    options = _build_options(hits, budget, scenario)
    if not options:
        say("agent", "Niks binnen budget én op voorraad. Ik zou je budget willen "
                     "verhogen of een alternatief voorstellen. (einde demo-pad)")
        return 2

    print(_rule("3 · VOORSTEL  (max 3 opties)"))
    for i, o in enumerate(options[:3], 1):
        say("agent", f"{i}. {o['title']} — {o['variant_label']} — {be.euro(o['price'])}"
                     f"  ({o['stock']} op voorraad)")
    choice = options[0]
    say("agent", f"Mijn tip: #1 {choice['title']} ({be.euro(choice['price'])}).")
    pause(auto)

    print(_rule("4 · CART  (guardrail: voorraad)"))
    say("sys", f"$ python3 commerce.py add-cart {choice['slug']} --variant {choice['variant_id']}")
    res, ok = commerce("add-cart", choice["slug"], "--variant", choice["variant_id"])
    if not ok:
        say("postnl", f"⚠ backend weigert: {res.get('error')}")
        say("agent", "Voorraad-guardrail sprong aan — ik plaats deze variant niet.")
        return 3
    cart = res["cart"]
    say("agent", f"Toegevoegd. Winkelwagen: {cart['count']} item(s), totaal {cart['total_display']}.")
    pause(auto)

    print(_rule("5 · VERZENDING  (adres uit profiel — alleen vragen als 't ontbreekt)"))
    say("sys", "$ python3 commerce.py profile")
    prof, _ = commerce("profile")
    name, phone, city, address = _resolve_address(prof, unknown_address, auto)
    if name is None:
        say("agent", "Geen profiel én geen adres → ik kan niet afronden. (einde demo-pad)")
        return 7
    pause(auto)

    print(_rule("6 · DRAFT ORDER  (nog niet bindend)"))
    say("sys", "$ python3 commerce.py create-order --name … --city … --address …")
    res, ok = commerce("create-order", "--name", name, "--phone", phone,
                       "--city", city, "--address", address)
    if not ok:
        say("postnl", f"⚠ order mislukt: {res.get('error')}")
        return 4
    order = res["order"]
    say("postnl", f"Draft {order['order_id']} — status: {order['status']} "
                  f"(nog niks belast).")
    say("agent", "Alles staat klaar. Ik heb tot hier niets van jou nodig gehad. "
                 "Nu de enige menselijke stap.")
    pause(auto)

    print(_rule("7 · HÉT MOMENT  →  PostNL Checkout op je Garmin"))
    # Guardrail: don't nudge the human toward an expired checkout link.
    fresh = next(o for o in be.list_orders() if o["order_id"] == order["order_id"])
    if not be.payment_url_valid(fresh):
        say("agent", "De checkout-link is verlopen — ik genereer een nieuwe i.p.v. "
                     "je te laten vastlopen. (guardrail)")
        return 5
    say("agent", "Ik stuur PostNL Checkout naar je pols. Eén tik = akkoord (incl. adres) én betaald.")
    item_lines = [f"{it['title']} — {it['variant_label']} ×{it['qty']} — {be.euro(it['unit_price'])}"
                  for it in cart["items"]]
    # Adres staat op de checkout: de tik keurt product + adres + betaling in één keer goed.
    item_lines.append(f"→ bezorgen naar {name}, {address}, {city}")
    paid_ok = garmin.checkout_on_wrist(
        title=choice["title"],
        item_lines=item_lines,
        total_display=f"Totaal {cart['total_display']}",
        checkout_url=order["checkout_url"],
        auto=auto,
        auto_decline=decline,
    )
    if not paid_ok:
        say("agent", "Checkout niet voltooid → draft blijft onbetaald, niks belast. "
                     "Netjes afgebroken.")
        return 10

    # The wrist tap deep-linked into PostNL Checkout; complete it on the backend.
    say("sys", f"→ PostNL Checkout voltooid  ·  $ commerce.py checkout {order['order_id']}")
    res, ok = commerce("checkout", order["order_id"])
    if not ok:
        say("postnl", f"⚠ checkout niet gelukt: {res.get('error')}")
        return 6
    paid = res["order"]

    print(_rule("8 · BEVESTIGING"))
    say("postnl", f"Betaald ✓  status: {paid['status']}  ·  Track & Trace: {paid['tracking_code']}")
    garmin.wrist_toast(f"{paid['order_id']} · onderweg")
    say("agent", f"Klaar! {paid['order_id']}, {paid['total_display']}, tracking "
                 f"{paid['tracking_code']}. Eén tik van jou, de rest deed ik. 🎉")
    return 0


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def _resolve_address(prof: dict, force_unknown: bool, auto: bool):
    """Use the saved profile; only ask when it isn't known."""
    if prof.get("known") and not force_unknown:
        # Geen aparte bevestiging: het adres staat straks op de checkout en is
        # onderdeel van die ene tik. Dus GEEN tweede actie.
        say("agent", f"Ik gebruik je opgeslagen adres ({prof['address']}, "
                     f"{prof['city']}) — je ziet 'm zo op de checkout en kunt daar wijzigen.")
        return prof["name"], prof["phone"], prof["city"], prof["address"]

    # Not known → the ONE extra question the agent must ask.
    say("agent", "Ik heb nog geen bezorgadres van je. Naar welk adres mag het?")
    if auto:
        name, phone, city, address = "Jan de Vries", "+31612345678", "Amsterdam", "Keizersgracht 1"
        say("user", f"{name}, {address}, {city}.")
        return name, phone, city, address
    address = input(_c("   → adres (straat + huisnummer): ")).strip()
    city = input(_c("   → plaats: ")).strip()
    name = input(_c("   → naam: ")).strip() or "Klant"
    if not address or not city:
        return None, None, None, None
    return name, "+31600000000", city, address


def _c(s: str) -> str:
    return f"{BOLD}{s}{RESET}"


def _keyword(intent: str) -> str:
    low = intent.lower()
    for kw in ["thee", "kaars", "sjaal", "plant", "chocola"]:
        if kw in low:
            return kw
    return "cadeau"


def _build_options(hits: list[dict], budget: int, scenario: str) -> list[dict]:
    options = []
    for h in hits:
        product = be.find_product(h["slug"])
        if not product:
            continue
        for v in product["variants"]:
            in_budget = v["price"] <= budget
            in_stock = v["stock"] > 0
            if scenario == "oos":
                if not in_stock and in_budget:
                    return [_opt(product, v)]
            if in_stock and in_budget:
                options.append(_opt(product, v))
    options.sort(key=lambda o: (budget - o["price"]))
    return options


def _opt(product: dict, v: dict) -> dict:
    return {
        "slug": product["slug"], "title": product["title"],
        "variant_id": v["id"], "variant_label": v["label"],
        "price": v["price"], "stock": v["stock"],
    }


def _rule(label: str) -> str:
    return f"\n{DIM}{'─' * 4}[ {BOLD}{label}{RESET}{DIM} ]{'─' * max(2, 64 - len(label))}{RESET}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--intent", default="Ik zoek een cadeau voor mijn moeder")
    ap.add_argument("--budget", type=int, default=40)
    ap.add_argument("--auto", action="store_true", help="non-interactive")
    ap.add_argument("--decline", action="store_true", help="dismiss checkout at the wrist")
    ap.add_argument("--scenario", choices=["happy", "oos"], default="happy")
    ap.add_argument("--unknown-address", action="store_true",
                    help="pretend the profile has no address (show the ask path)")
    args = ap.parse_args()

    print(f"\n{BOLD}PostNL × Agentic Commerce — offline preview{RESET}")
    print(f"{DIM}geen webshop-UI · agent autonoom tot aan het geld · "
          f"één tik: PostNL Checkout op je Garmin{RESET}")
    code = run(args.intent, args.budget, args.auto, args.decline,
               args.scenario, args.unknown_address)
    sys.exit(code)


if __name__ == "__main__":
    main()
