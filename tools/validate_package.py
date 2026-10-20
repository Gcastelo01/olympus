#!/usr/bin/env python3
"""Offline structural validation of Olympus v1.2 package (NOT a live Codex/Claude Code/Pi test)."""
from pathlib import Path
import json, os, re, sys, tomllib
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'tools'))
from olympus_models import PINS, SPECIALISTS, claude_pin
models={r:PINS[r] for r in SPECIALISTS}
skills=({*models}-{'atlas-critical'})|{'zeus'}
legacy={'blueprint','cartographer','forge','sentinel','lorekeeper','harbor','harbor-critical'}
fail=[]
package=json.loads((root/'package.json').read_text())
for launcher in ('templates/setup-olympus.sh','templates/setup-olympus.ps1','templates/setup-olympus.cmd','templates/bootstrap-user.sh'):
    if launcher not in package.get('files',[]): fail.append('Installer launcher missing from package files: '+launcher)
    if not (root/launcher).is_file(): fail.append('Missing installer launcher '+launcher)
for r in sorted(skills):
    p=root/'.agents/skills'/r/'SKILL.md'
    if not p.is_file(): fail.append('Missing skill '+str(p));continue
    t=p.read_text()
    m=re.search(r'\A---\n(.*?)\n---\n',t,re.S)
    if not m: fail.append('Missing YAML frontmatter '+str(p));continue
    if not re.search(rf'(?m)^name: {re.escape(r)}$',m.group(1)): fail.append('Wrong skill name '+str(p))
    if not re.search(r'(?m)^description: \S',m.group(1)): fail.append('Missing description '+str(p))
    if r not in t.lower(): fail.append('Role not mentioned '+r)
for r,(model,effort) in models.items():
    sc='atlas' if r=='atlas-critical' else r
    for ext,base in [('.md','.agents/agents'),('.toml','.codex/agents')]:
        p=root/base/(r+ext)
        if not p.is_file(): fail.append('Missing agent '+str(p));continue
        t=p.read_text()
        if f'.agents/skills/{sc}/SKILL.md' not in t:fail.append('Broken skill path '+str(p))
        if ext=='.toml':
            try: d=tomllib.loads(t)
            except Exception as exc:fail.append(f'TOML parse {p}: {exc}');continue
            if (d.get('name'),d.get('model'),d.get('model_reasoning_effort'))!=(r,model,effort):fail.append('Bad Codex pin '+r)
        else:
            if not t.startswith(f'---\nname: {r}\n'):fail.append('Bad Pi agent name '+r)
            if f'model: openai/{model}\n' not in t or f'thinking: {effort}\n' not in t:fail.append('Bad Pi pin '+r)
for r in legacy:
    for p in (root/'.agents/skills'/r,root/'.agents/agents'/(r+'.md'),root/'.codex/agents'/(r+'.toml')):
        if p.exists():fail.append('Legacy discoverable path '+str(p))
for mode in ('release','operate','incident'):
    if not (root/'.agents/skills/atlas/references'/(mode+'.md')).is_file():fail.append('Missing Atlas '+mode)
for name in ('CLAUDE.md','.claude/settings.json','AGENTS.template.md','AGENTS.integration.md','ENGINEERING-PROTOCOL.md','INSTALL.md','MIGRATION.md','OLYMPUS.md','ZEUS-EVALUATION.md','.codex/config.toml'):
    if not (root/name).is_file():fail.append('Missing document '+name)
# A legacy name embedded in an active instruction can still cause incorrect delegation.
pattern=re.compile(r'(?<![a-z0-9_])(?:blueprint|cartographer|forge|sentinel|lorekeeper|harbor)(?:-critical)?(?![a-z0-9_])',re.I)
for p in [*root.glob('.agents/skills/**/*.md'),*root.glob('.agents/agents/*.md'),*root.glob('.codex/agents/*.toml'),*root.glob('.claude/agents/*.md'),root/'AGENTS.template.md',root/'ENGINEERING-PROTOCOL.md']:
    matches=list(pattern.finditer(p.read_text()))
    if matches:fail.append('Legacy names remain in active file '+str(p)+' '+','.join(m.group() for m in matches[:3]))
# Zeus is root model, not an extra spawnable specialist.
if (root/'.codex/agents/zeus.toml').exists() or (root/'.agents/agents/zeus.md').exists(): fail.append('Do not configure Zeus as a child subagent')
try:
    cfg=tomllib.loads((root/'.codex/config.toml').read_text())
    if (cfg.get('model'),cfg.get('model_reasoning_effort'))!=PINS['zeus']:
        fail.append('Zeus root model pin mismatch')
    if cfg.get('agents',{}).get('enabled') is not True:
        fail.append('Subagent feature is not enabled')
except Exception as ex: fail.append('Bad root Codex config: '+str(ex))
if 'zeus/SKILL.md' not in (root/'AGENTS.template.md').read_text():fail.append('Missing Zeus bootstrap in AGENTS template')
for key in ('ROUTING', 'Moirai','Hephaestus','Argus'):
    if key.lower() not in (root/'.agents/skills/zeus/SKILL.md').read_text().lower():fail.append('Zeus is missing '+key)
# Three weaving stages, single skill.
mt=(root/'.agents/skills/moirai/SKILL.md').read_text()
for name in ('Clotho','Lachesis','Atropos'):
    if name not in mt:fail.append('Missing Moirai pass '+name)

# ---- Claude Code binding ----
def fm(path):
    txt=path.read_text(); m=re.match(r'---\n(.*?)\n---\n',txt,re.S)
    if not m: return None,txt
    d={}
    for line in m.group(1).splitlines():
        mm=re.match(r'^([A-Za-z]+):\s*(.*)$',line)
        if mm: d[mm.group(1)]=mm.group(2).strip()
    return d,txt
for r in ['zeus',*SPECIALISTS]:
    p=root/'.claude/agents'/(r+'.md')
    if not p.is_file(): fail.append('Missing Claude agent '+str(p));continue
    d,t=fm(p)
    if d is None: fail.append('Missing frontmatter '+str(p));continue
    model,effort=claude_pin(r)
    if (d.get('name'),d.get('model'),d.get('effort'))!=(r,model,effort): fail.append(f'Bad Claude pin {r}: {d.get("model")}/{d.get("effort")} != {model}/{effort}')
    if not d.get('description'): fail.append('Missing Claude description '+r)
    tools=d.get('tools','')
    sc='atlas' if r.startswith('atlas') else r
    if f'.agents/skills/{sc}/SKILL.md' not in t: fail.append('Broken skill path '+str(p))
    if r=='zeus':
        m=re.search(r'Agent\(([^)]*)\)',tools)
        if not m or sorted(x.strip() for x in m.group(1).split(','))!=sorted(SPECIALISTS): fail.append('Zeus Agent allowlist must list exactly the 8 specialists')
        if re.search(r'\b(Write|Edit|MultiEdit|NotebookEdit)\b',tools): fail.append('Zeus must not have file-editing tools')
    else:
        if re.search(r'\bAgent\b',tools): fail.append('Specialist may not spawn agents: '+r)
        if r=='argus' and re.search(r'\b(Write|Edit|MultiEdit|NotebookEdit)\b',tools): fail.append('Argus must be read-only')
        if r in ('athena','moirai','orpheus','aegis','atlas','atlas-critical') and 'olympus_guard.py' not in t: fail.append('Missing write-scope hook '+r)
guard=root/'.claude/hooks/olympus_guard.py'
if not guard.is_file(): fail.append('Missing '+str(guard))
elif not os.access(guard,os.X_OK): fail.append('Hook not executable '+str(guard))
try:
    s=json.loads((root/'.claude/settings.json').read_text())
    if s.get('agent')!='zeus': fail.append('Claude settings must set "agent": "zeus"')
except Exception as ex: fail.append('Bad .claude/settings.json: '+str(ex))
cm=root/'CLAUDE.md'
if not cm.is_file() or not re.search(r'(?m)^@AGENTS\.md\s*$',cm.read_text()): fail.append('CLAUDE.md must import @AGENTS.md')
if fail:
    print('\n'.join('FAIL: '+x for x in fail));sys.exit(1)
print('OK: Olympus v1.2 / 8 skills; Codex root Luna medium + 8 TOML pins; Claude Code root Haiku medium + 8 agent pins; Pi profiles; Moirai passes; no active legacy names')
