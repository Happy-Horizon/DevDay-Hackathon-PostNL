#!/usr/bin/env python3
"""smoke_test.py — proves the preview actually works, offline, no creds.

Runs every commerce.py command and every agent path, asserting on the results.
Exit 0 = all green. Run it after any change:

    python3 smoke_test.py
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PASS, FAIL = 0, 0


def _run(*args: str) -> tuple[dict, int]:
    proc = subprocess.run([sys.executable, str(HERE / "commerce.py"), *args],
                          capture_output=True, text=True)
    try:
        return json.loads(proc.stdout or "{}"), proc.returncode
    except json.JSONDecodeError:
        return {"_stderr": proc.stderr}, proc.returncode


def check(name: str, cond: bool, detail: str = "") -> None:
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  \033[32m✓\033[0m {name}")
    else:
        FAIL += 1
        print(f"  \033[31m✗\033[0m {name}  {detail}")


def agent_exit(*args: str) -> int:
    return subprocess.run([sys.executable, str(HERE / "agent.py"), *args],
                          capture_output=True, text=True).returncode


def main() -> None:
    print("commerce.py — CLI surface")
    _run("reset")

    data, rc = _run("search", "kaars")
    check("search vindt de kaars", rc == 0 and any("kaars" in r["slug"] for r in data["results"]))

    data, rc = _run("list", "--limit", "10")
    check("list geeft ≥5 producten", rc == 0 and len(data["results"]) >= 5)

    data, rc = _run("get", "geurkaars-duinroos")
    check("get geeft varianten", rc == 0 and len(data["variants"]) == 2)

    data, rc = _run("get", "bestaat-niet")
    check("get onbekend → exit 1", rc == 1 and data["ok"] is False)

    # Guardrail: out-of-stock variant must be refused.
    data, rc = _run("add-cart", "thee-cadeaubox", "--variant", "thee-deluxe")
    check("add-cart out-of-stock → geweigerd", rc == 1 and "voorraad" in data["error"].lower())

    # Guardrail: unknown variant refused with helpful options.
    data, rc = _run("add-cart", "geurkaars-duinroos", "--variant", "nope")
    check("add-cart onbekende variant → geweigerd", rc == 1 and "variant" in data["error"].lower())

    data, rc = _run("add-cart", "geurkaars-duinroos", "--variant", "kaars-groot")
    check("add-cart geldig → ok", rc == 0 and data["ok"] is True)

    data, rc = _run("cart")
    check("cart telt totaal (€24,95)", rc == 0 and data["total"] == 2495 and data["count"] == 1)

    data, rc = _run("profile")
    check("profile bekend (adres auto-fill)", rc == 0 and data["known"] is True and data["address"])

    data, rc = _run("create-order", "--name", "Test", "--phone", "+31600000000",
                    "--city", "Amsterdam", "--address", "Damrak 1")
    ok_order = rc == 0 and data["ok"] and data["order"]["checkout_url"].startswith("https://")
    check("create-order → checkout URL (draft, agent betaalt niet)", ok_order)
    order_id = data["order"]["order_id"] if ok_order else ""
    check("nieuwe order = draft (awaiting_checkout)",
          ok_order and data["order"]["status"] == "awaiting_checkout")

    data, rc = _run("cart")
    check("cart leeg na order", rc == 0 and data["count"] == 0)

    data, rc = _run("checkout", order_id)
    check("checkout → één actie = paid + tracking", rc == 0 and data["order"]["status"] == "paid"
          and data["order"]["tracking_code"].startswith("3S"))

    data, rc = _run("checkout", "PNL-NOPE")
    check("checkout onbekende order → exit 1", rc == 1)

    print("\nagent.py — end-to-end paden")
    check("happy path (adres uit profiel) → exit 0", agent_exit("--auto") == 0)
    check("checkout dismissed → exit 10 (draft onbetaald)", agent_exit("--auto", "--decline") == 10)
    check("out-of-stock scenario → exit 3 (guardrail)", agent_exit("--auto", "--scenario", "oos") == 3)
    check("onbekend adres → agent vraagt, draait door", agent_exit("--auto", "--unknown-address") == 0)
    check("thee-intent + laag budget draait", agent_exit("--auto", "--intent", "iets met thee", "--budget", "25") == 0)

    _run("reset")
    print(f"\n{'='*40}\n  {PASS} geslaagd, {FAIL} gefaald")
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
