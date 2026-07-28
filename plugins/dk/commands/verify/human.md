---
description: Hand back the Human Verification Required list. human_needed is never a pass.
gate: verdict
on: "verify:goal returned human_needed"
blocking: true
---
Give me the Human Verification Required list. I will run the items by hand and report back. Do not
treat human_needed as a pass, do not mark the phase verified, and do not proceed to the next phase
until I have confirmed each item.
