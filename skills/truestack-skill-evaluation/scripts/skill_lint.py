#!/usr/bin/env python3
"""Deterministic static lint for Agent Skills. No dependencies.

Usage:  python3 skill_lint.py <skills-dir>   # default: ./skills or .
Scans <dir>/*/SKILL.md and reports per-skill findings + a structural score (0-10),
plus set-level checks (trigger collisions). Exit code 1 if any Critical finding.
"""
import os, re, sys, json, glob

BODY_LINE_BUDGET = 250
BODY_CHAR_BUDGET = 12000       # rubric budget: ~250 lines / ~12k chars — enforce BOTH halves
DESC_MIN, DESC_MAX = 40, 1024  # 1024 = the platform hard limit for the description field
COLLISION_MIN = 6             # set-level: report skill pairs sharing >= this many distinctive desc terms
# Generic words filtered out before computing trigger-surface overlap (keep domain terms).
STOP = frozenset("""
the and for with you your this that from into them they their then than will would should could
also only even just more most some like such what which while work working code coding task tasks
user users skill skills claude project projects thing things make makes made need needs want wants
does doing done over under each every here there where about across against between because using
use used when whenever after before were have not but any all
""".split())

def parse(path):
    t = open(path, encoding="utf-8").read()
    t = t.replace("\r\n", "\n").replace("\r", "\n")  # normalize newlines so the regex matches on any platform
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', t, re.S)
    if not m:
        return None, "", t
    fm, body = m.group(1), m.group(2)
    name = re.search(r'^name:\s*(.+)$', fm, re.M)
    desc = re.search(r'description:\s*(.+?)(?:\n[a-z_]+:|\Z)', fm, re.S)
    name = name.group(1).strip() if name else None
    desc = re.sub(r'\s+', ' ', desc.group(1)).strip() if desc else ""
    return name, desc, body

def lint_skill(folder):
    sp = os.path.join(folder, "SKILL.md")
    fname = os.path.basename(folder.rstrip("/"))
    findings = []  # (severity, code, msg)
    if not os.path.exists(sp):
        return fname, 0.0, [("CRIT", "NO_SKILL_MD", "no SKILL.md")], {}
    name, desc, body = parse(sp)
    if name is None:
        findings.append(("CRIT", "NO_FRONTMATTER", "missing YAML frontmatter"))
    if not name:
        findings.append(("CRIT", "NO_NAME", "no name in frontmatter"))
    elif name != fname:
        findings.append(("CRIT", "NAME_MISMATCH", f"name '{name}' != folder '{fname}'"))
    # description checks
    if not desc:
        findings.append(("CRIT", "EMPTY_DESCRIPTION", "no description"))
    else:
        if len(desc) < DESC_MIN:
            findings.append(("REQ", "THIN_DESCRIPTION", f"description {len(desc)}c < {DESC_MIN}"))
        if len(desc) > DESC_MAX:
            findings.append(("OPT", "LONG_DESCRIPTION", f"description {len(desc)}c > {DESC_MAX}"))
        if not re.search(r'\b(use|when|whenever|after|before)\b', desc, re.I):
            findings.append(("CRIT", "MISSING_TRIGGER", "description never says WHEN to use it"))
    # body budget (both halves of the rubric budget: lines AND chars)
    blines = body.count("\n") + 1
    bchars = len(body)
    if blines > BODY_LINE_BUDGET:
        findings.append(("REQ", "BLOATED_SKILL", f"body {blines} lines > {BODY_LINE_BUDGET} budget"))
    if bchars > BODY_CHAR_BUDGET:
        findings.append(("REQ", "BLOATED_SKILL", f"body {bchars} chars > {BODY_CHAR_BUDGET} budget"))
    # references: orphan + dead-ref
    refdir = os.path.join(folder, "references")
    ref_files = set(os.path.basename(p) for p in glob.glob(os.path.join(refdir, "*"))) if os.path.isdir(refdir) else set()
    referenced = set(re.findall(r'references/([A-Za-z0-9_\-]+\.md)', body))
    for r in referenced - ref_files:
        findings.append(("CRIT", "DEAD_CROSS_REF", f"body points to references/{r} which is missing"))
    for f in ref_files - referenced:
        if f.endswith(".md"):
            findings.append(("OPT", "ORPHAN_REFERENCE", f"references/{f} not linked from body"))
    # over-constrained heuristic
    musts = len(re.findall(r'\b(MUST|NEVER|ALWAYS)\b', body))
    if musts > 25:
        findings.append(("OPT", "OVER_CONSTRAINED", f"{musts} hard MUST/NEVER/ALWAYS — may be brittle"))
    # score: start 10, subtract by severity
    pen = {"CRIT": 3.0, "REQ": 1.0, "OPT": 0.4}
    score = max(0.0, 10.0 - sum(pen[s] for s, _, _ in findings))
    meta = {"name": name, "desc_len": len(desc), "body_lines": blines, "body_chars": bchars,
            "refs": sorted(ref_files), "referenced": sorted(referenced),
            "trigger_terms": sorted(set(re.findall(r'\b(use|when|whenever|after|before)\b', desc, re.I))),
            "desc_tokens": sorted(w for w in set(re.findall(r'[a-z]{4,}', desc.lower())) if w not in STOP)}
    return fname, round(score, 1), findings, meta

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else ("skills" if os.path.isdir("skills") else ".")
    folders = sorted(p for p in glob.glob(os.path.join(base, "*")) if os.path.isdir(p) and os.path.exists(os.path.join(p, "SKILL.md")))
    if not folders:
        print(f"No SKILL.md found under {base}/"); sys.exit(2)
    results, crit = [], 0
    descs = {}
    print(f"\nSkill lint — {base}/  ({len(folders)} skills)\n" + "=" * 60)
    for f in folders:
        nm, score, findings, meta = lint_skill(f)
        results.append((nm, score, findings))
        descs[nm] = set(meta.get("desc_tokens", []))
        ncrit = sum(1 for s, _, _ in findings if s == "CRIT"); crit += ncrit
        badge = "NEEDS-WORK" if ncrit else ("GOLD" if score >= 8.5 else "SILVER" if score >= 7 else "BRONZE" if score >= 5.5 else "NEEDS-WORK")
        print(f"\n{nm:18} static={score:4}/10  [{badge}]  body={meta.get('body_lines','?')}l/{meta.get('body_chars','?')}c desc={meta.get('desc_len','?')}c")
        for sev, code, msg in findings:
            print(f"    {sev:4} {code:18} {msg}")
        if not findings:
            print("    clean — no static findings")
    avg = round(sum(r[1] for r in results) / len(results), 2)
    print("\n" + "=" * 60)
    print(f"Set static score (avg): {avg}/10   skills={len(results)}   critical findings={crit}")
    # set-level: heuristic trigger-surface overlap (the docstring's "trigger collisions")
    names = sorted(descs)
    overlaps = []
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            shared = descs[names[i]] & descs[names[j]]
            if len(shared) >= COLLISION_MIN:
                overlaps.append((len(shared), names[i], names[j], sorted(shared)))
    overlaps.sort(reverse=True)
    print("\nSet-level trigger-surface overlap (heuristic; review pairs that should NOT co-fire):")
    if not overlaps:
        print(f"  none — no pair shares >= {COLLISION_MIN} distinctive description terms")
    else:
        for n, a, b, sh in overlaps[:10]:
            tail = " ..." if len(sh) > 8 else ""
            print(f"  [{n}] {a} ~ {b}: {', '.join(sh[:8])}{tail}")
        print("  (word-overlap heuristic, not a hard finding — sharpen descriptions where a pair collides)")
    print("Note: this is the DETERMINISTIC layer only — judge + behavioral layers are added by the skill.")
    sys.exit(1 if crit else 0)

if __name__ == "__main__":
    main()
