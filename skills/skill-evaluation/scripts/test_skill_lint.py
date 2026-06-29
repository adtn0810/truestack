#!/usr/bin/env python3
"""Unit tests for skill_lint.py — no external deps. Run: python test_skill_lint.py

Golden-fixture tests: one clean skill plus one fixture per Critical code, asserting the
right findings fire (and don't fire) and that CRLF files still parse. Exit 1 on any failure.
"""
import os, sys, tempfile, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("skill_lint", os.path.join(HERE, "skill_lint.py"))
sl = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sl)


def write_skill(base, folder, text, newline="\n"):
    d = os.path.join(base, folder)
    os.makedirs(d, exist_ok=True)
    # newline="" => no translation on write, so we control the exact bytes
    with open(os.path.join(d, "SKILL.md"), "w", encoding="utf-8", newline="") as f:
        f.write(text.replace("\n", newline))
    return d


def codes(findings):
    return {c for _, c, _ in findings}


def has_crit(findings):
    return any(s == "CRIT" for s, _, _ in findings)


CLEAN = """---
name: {name}
description: Does a clean thing for testing. Use when verifying the linter on a valid skill.
---

# {name}

A minimal valid body.
"""

FAILS = []


def check(cond, msg, ctx=""):
    if not cond:
        FAILS.append(f"{msg}  {ctx}")


def run():
    with tempfile.TemporaryDirectory() as t:
        # clean skill (LF)
        d = write_skill(t, "clean-skill", CLEAN.format(name="clean-skill"))
        _, _, find, _ = sl.lint_skill(d)
        check(not has_crit(find), "clean skill should have no Critical", str(codes(find)))

        # clean skill written with CRLF — regression guard for newline normalization
        d = write_skill(t, "crlf-skill", CLEAN.format(name="crlf-skill"), newline="\r\n")
        _, _, find, _ = sl.lint_skill(d)
        check("NO_FRONTMATTER" not in codes(find), "CRLF frontmatter must still parse", str(codes(find)))
        check(not has_crit(find), "CRLF clean skill should have no Critical", str(codes(find)))

        # name != folder
        d = write_skill(t, "folder-x", CLEAN.format(name="different-name"))
        _, _, find, _ = sl.lint_skill(d)
        check("NAME_MISMATCH" in codes(find), "expected NAME_MISMATCH", str(codes(find)))

        # empty description
        d = write_skill(t, "no-desc", "---\nname: no-desc\ndescription:\n---\n\n# no-desc\n\nbody\n")
        _, _, find, _ = sl.lint_skill(d)
        check("EMPTY_DESCRIPTION" in codes(find), "expected EMPTY_DESCRIPTION", str(codes(find)))

        # description with no when/use trigger word
        d = write_skill(t, "no-trigger",
                        "---\nname: no-trigger\ndescription: A description that omits any trigger verb entirely.\n---\n\n# no-trigger\n\nbody\n")
        _, _, find, _ = sl.lint_skill(d)
        check("MISSING_TRIGGER" in codes(find), "expected MISSING_TRIGGER", str(codes(find)))

        # dead cross reference
        d = write_skill(t, "dead-ref",
                        "---\nname: dead-ref\ndescription: Points at a missing reference. Use when testing dead refs.\n---\n\n# dead-ref\n\nSee references/missing.md for details.\n")
        _, _, find, _ = sl.lint_skill(d)
        check("DEAD_CROSS_REF" in codes(find), "expected DEAD_CROSS_REF", str(codes(find)))

        # a Critical finding must drop the score below the max
        _, score, find, _ = sl.lint_skill(d)
        check(score < 10.0 and has_crit(find), "Critical finding should reduce score", f"score={score}")

    if FAILS:
        print("FAIL:")
        for f in FAILS:
            print("  - " + f)
        sys.exit(1)
    print("All skill_lint tests passed.")
    sys.exit(0)


if __name__ == "__main__":
    run()
