#!/usr/bin/env python3
"""GarminConfirm™ — the ONE human moment, on your wrist.

The refined design: the agent does everything autonomously up to the money.
Then it pushes a **PostNL Checkout deep-link** to your Garmin. One tap opens the
PostNL app where a single action is BOTH your approval AND your payment. The
watch isn't a separate "yes" -- it's the nudge that carries you to the one
moment that matters.

It's a joke wrapper, but the lesson is serious: put that single moment on a
device the user already trusts and carries. Swap this module for a real
WhatsApp button, a voice confirm, or the PostNL app push -- the agent flow does
not change.
"""
from __future__ import annotations

import sys
import time

RESET = "\033[0m"
DIM = "\033[2m"
BOLD = "\033[1m"
CYAN = "\033[36m"
GREEN = "\033[32m"
RED = "\033[31m"
ORANGE = "\033[33m"


def _c(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"


def _watch(lines: list[str], heart: str, footer: str) -> str:
    """Render a round-ish smartwatch face around up to 4 short content lines."""
    while len(lines) < 4:
        lines.append("")
    w = 27
    body = [line[:w].center(w) for line in lines]
    return "\n".join([
        _c("       ▄▄▄▄▄▄▄▄▄▄▄▄▄       ", DIM),
        _c("      ╭───────────────╮      ", DIM),
        _c("   ╭──┤", DIM) + " " + _c("GARMIN", BOLD) + "  " + heart + " " + _c("├──╮   ", DIM),
        _c("   │  │", DIM) + _c(f"{body[0]}", CYAN) + _c("│  │   ", DIM),
        _c("   │  │", DIM) + f"{body[1]:^{w}}" + _c("│  │   ", DIM),
        _c("   │  │", DIM) + _c(f"{body[2]:^{w}}", BOLD) + _c("│  │   ", DIM),
        _c("   ╰──┤", DIM) + _c(f"{body[3]:^{w}}", GREEN) + _c("├──╯   ", DIM),
        _c("      ╰───────────────╯      ", DIM),
        _c("           " + footer, DIM),
    ])


def _buzz(times: int = 3) -> None:
    frames = ["  )))  ⌚  (((  ", "   ))  ⌚  ((   ", "    ) ⌚ (    ", "      ⌚      "]
    for _ in range(times):
        for f in frames:
            sys.stdout.write("\r   " + _c("BZZT " + f, ORANGE))
            sys.stdout.flush()
            time.sleep(0.06)
    sys.stdout.write("\r" + " " * 40 + "\r")
    sys.stdout.flush()


def checkout_on_wrist(title: str, item_lines: list[str], total_display: str,
                      checkout_url: str, auto: bool = False,
                      auto_decline: bool = False) -> bool:
    """Push the PostNL Checkout deep-link to the wrist.

    ONE tap = approve + pay in the PostNL app. Returns True if the human
    completes checkout, False if they dismiss it.
    """
    print()
    print(_c("   ⌚  PostNL Checkout op je Garmin…", ORANGE))
    _buzz(3)

    # The nudge: order + total, ready to open PostNL Checkout.
    print(_watch(
        lines=["PostNL Checkout", title, total_display, "open om te betalen →"],
        heart=_c("♥ 72", GREEN),
        footer="tik om te openen",
    ))
    time.sleep(0.35 if not auto else 0.1)
    print()
    print(_c("   ♥ hartslag: 72 → 88 → 121 bpm  (het is een mooi cadeau)", RED))
    print()

    # The ONE moment: this single tap is approval AND payment together.
    print(_watch(
        lines=["AKKOORD + BETAAL", item_lines[0] if item_lines else "", total_display, "START = betaal"],
        heart=_c("♥121", RED),
        footer="één tik = ja + betaald · BACK = weg",
    ))
    print()
    for ln in item_lines:
        print(_c("      • " + ln, DIM))
    print(_c(f"      ↳ PostNL Checkout: {checkout_url}", DIM))
    print()

    if auto:
        decision = not auto_decline
        label = "START ▶ betaal (auto)" if decision else "BACK ◀ weg (auto)"
        print(_c(f"   [{label}]  …", DIM))
        time.sleep(0.6)
    else:
        ans = input(_c("   [Enter]=betaal in PostNL-app  ·  'n'=annuleer: ", BOLD)).strip().lower()
        decision = ans not in ("n", "no", "nee", "back")

    if decision:
        print(_c("   ✓ Betaald in de PostNL-app. Akkoord + betaling in één tik. ♥→79.", GREEN))
    else:
        print(_c("   ✗ Checkout gesloten. Draft-order blijft onbetaald, niks belast.", RED))
    print()
    return decision


def wrist_toast(message: str) -> None:
    """A short one-line push to the watch (e.g. final tracking code)."""
    print()
    print(_watch(lines=["PostNL", message, "", "✓"], heart=_c("♥ 74", GREEN),
                 footer="bezorging onderweg"))
    print()


if __name__ == "__main__":
    ok = checkout_on_wrist(
        "Geurkaars Duinroos",
        ["Geurkaars Duinroos — Groot (250g) ×1 — €24,95"],
        "Totaal €24,95",
        "https://checkout.postnl.example/co/PNL-DEMO",
        auto="--auto" in sys.argv,
    )
    if ok:
        wrist_toast("Order PNL-DEMO betaald")
