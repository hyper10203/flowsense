
# ALGORITHMS.md

# FlowSense Algorithm Specification

## Objective
Detect repeated user workflows locally without relying on AI. AI is only used after a workflow has been detected to generate a human-friendly name, summary, and optimization suggestion.

## Activity Pipeline

1. Capture desktop activity every 3–5 seconds.
2. Normalize events.
3. Remove duplicate consecutive events.
4. Store events in SQLite.
5. Run pattern detection.
6. Score detected workflows.
7. Send qualifying workflows to Gemini.
8. Save AI output locally.
9. Surface suggestions to the user.

---

## Event Normalization

Normalize application names:
- chrome.exe → Chrome
- Code.exe → VS Code
- explorer.exe → File Explorer

Normalize URLs:
- Remove query parameters.
- Ignore tracking parameters.
- Group identical domains when appropriate.

Ignore:
- Idle periods
- System dialogs
- Background processes

---

## Sequence Mining

Sliding window sizes:
- 3
- 4
- 5
- 6
- 7
- 8 steps

Generate hashes for normalized sequences.

Example:

Chrome
→ VS Code
→ Terminal
→ Chrome

Hash:

SHA256(normalized_sequence)

Track frequency of identical hashes.

---

## Workflow Detection Rules

Minimum repetitions:
3

Minimum confidence:
0.75

Maximum gap between steps:
10 minutes

Discard workflows containing only one application.

Merge highly similar workflows.

---

## Confidence Score

Factors:
- Frequency
- Sequence consistency
- Timing consistency
- Completion rate

Example:

confidence =
0.4*frequency +
0.3*consistency +
0.2*timing +
0.1*completion

Clamp to 0–1.

---

## AI Invocation

Only invoke Gemini when:
- Workflow is new, OR
- Workflow changed significantly.

Prompt requests:
- Workflow name
- Purpose
- Suggested optimization

Expected JSON:

{
  "name":"",
  "purpose":"",
  "suggestion":""
}

Reject invalid JSON and retry once.

---

## Duplicate Detection

Before creating a workflow:
- Compare hash.
- Compare edit distance.
- Merge if similarity >90%.

---

## Timeline Generation

Sort by timestamp.

Group consecutive identical events into a single block with duration.

---

## Analytics

Compute:
- Active minutes
- Idle minutes
- App switches
- Top apps
- Workflow count
- Daily trends

Cache daily summaries.

---

## Search Index

Index:
- Application
- Window title
- URL
- Workflow name

Use SQLite FTS5 where available.

---

## Performance Targets

Pattern detection:
<500 ms for 10,000 events.

Memory:
<300 MB.

CPU:
Minimal background usage.

---

## Privacy Rules

Never transmit raw activity history.

Only send minimal workflow summaries to Gemini if AI is enabled.

---

## Pseudocode

```text
capture_event()
 -> normalize()
 -> store()
 -> detect_sequences()
 -> score()
 -> if confidence >= threshold:
      call_ai()
      save_workflow()
      notify_user()
```

---

## Testing

Test cases:
- Single repeated workflow
- Overlapping workflows
- Random activity
- Browser-only usage
- Long idle periods
- Large datasets

---

## Implementation Rules

- Keep algorithms deterministic.
- Separate detection logic from AI.
- Unit test each algorithm independently.
- Document all thresholds.
- Commit each completed algorithm module.
- Push changes using the GitHub account already authenticated on the development machine.

---

## Definition of Done

- Sequence mining implemented
- Confidence scoring implemented
- Duplicate merging implemented
- AI integration isolated
- Benchmarks meet targets
- Tests passing
