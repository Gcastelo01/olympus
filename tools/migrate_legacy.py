#!/usr/bin/env python3
"""Preview or safely back up conflicting v2 agent files before Olympus activation."""
from pathlib import Path
from datetime import datetime
import argparse, shutil, sys

p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--apply',action='store_true',help='Move legacy roles to external timestamped backup; default is dry run')
p.add_argument('--repo',type=Path,default=Path(__file__).resolve().parents[1])
a=p.parse_args()
repo=a.repo.resolve()
replacements={'blueprint':'athena','cartographer':'moirai','forge':'hephaestus','sentinel':'argus','lorekeeper':'orpheus','harbor':'atlas','harbor-critical':'atlas-critical'}
missing=[]
for role in ['athena','moirai','hephaestus','argus','orpheus','aegis','atlas']:
    if not (repo/'.agents/skills'/role/'SKILL.md').is_file():missing.append('skill:'+role)
for role in ['athena','moirai','hephaestus','argus','orpheus','aegis','atlas','atlas-critical']:
    if not (repo/'.agents/agents'/(role+'.md')).is_file() or not (repo/'.codex/agents'/(role+'.toml')).is_file():missing.append('profiles:'+role)
if missing:
    sys.exit('ERROR: Install complete Olympus files before migration: '+', '.join(missing))
legacy=[]
for role in replacements:
    for rel in (Path('.agents/skills')/role,Path('.agents/agents')/(role+'.md'),Path('.codex/agents')/(role+'.toml')):
        target=repo/rel
        if target.exists() or target.is_symlink(): legacy.append(rel)
if not legacy:
    print('No conflicting v2 agent/skill paths found. Review AGENTS.md for legacy routing yourself.');sys.exit(0)
print('Legacy paths found:')
for x in legacy:print('  ',x)
if not a.apply:
    print('DRY RUN: Nothing changed. Re-run with --apply to move exactly these paths out of the repo.');sys.exit(0)
backup=repo.parent/(repo.name+'.olympus-v2-backup-'+datetime.now().strftime('%Y%m%d-%H%M%S'))
if backup.exists():sys.exit('ERROR: Backup destination exists: '+str(backup))
for rel in legacy:
    target=backup/rel
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.move(str(repo/rel),str(target))
print('Backed up',len(legacy),'legacy paths at',backup)
print('NOTE: Existing AGENTS.md was not edited; merge AGENTS.template.md and remove obsolete routes manually.')
