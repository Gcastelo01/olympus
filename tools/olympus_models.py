"""Single source of truth for Olympus runtime pins (Codex, Pi and Claude Code).

Tier mapping used by Olympus v1.3:
    economical coordination / execution : gpt-6-luna   <-> claude-haiku-5-5
    balanced specialist                 : gpt-6.1-sol  <-> claude-sonnet-5-5
    deepest analysis                    : gpt-6-astra  <-> claude-opus-5-5
Reasoning effort is carried over unchanged (low / medium / high).
"""

CODEX_TO_CLAUDE = {
    "gpt-6-luna": "claude-haiku-5-5",
    "gpt-6.1-sol": "claude-sonnet-5-5",
    "gpt-6-astra": "claude-opus-5-5",
}

# role -> (codex model, effort)
PINS = {
    "zeus": ("gpt-6-luna", "medium"),
    "athena": ("gpt-6-astra", "high"),
    "moirai": ("gpt-6.1-sol", "medium"),
    "hephaestus": ("gpt-6-luna", "low"),
    "argus": ("gpt-6.1-sol", "high"),
    "orpheus": ("gpt-6.1-sol", "medium"),
    "aegis": ("gpt-6-astra", "high"),
    "atlas": ("gpt-6.1-sol", "medium"),
    "atlas-critical": ("gpt-6-astra", "high"),
    "hades": ("gpt-6-astra", "high"),
}

SPECIALISTS = [r for r in PINS if r != "zeus"]


def claude_pin(role):
    model, effort = PINS[role]
    return CODEX_TO_CLAUDE[model], effort
