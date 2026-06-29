---
description: Score and audit Agent Skills — static lint + semantic judge + behavioral trigger test — and report a scorecard with concrete fixes.
argument-hint: [skill name or skills dir; default: whole set]
---
Use the **truestack-skill-evaluation** skill.

Target: $ARGUMENTS (default: every skill in the set)

Run the static lint (`skills/truestack-skill-evaluation/scripts/skill_lint.py`), then the semantic judge and the
behavioral trigger test per the rubric. Report the scorecard (per skill: static / judge /
behavioral / total / badge + top fix), Critical findings first, plus set-level trigger-collision
and token-budget checks. Label measured vs judged honestly; a Critical finding caps the badge —
don't average it away.
