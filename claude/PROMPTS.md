
# PROMPTS.md

# FlowSense AI Prompt Specification

## Purpose
Gemini is **not** responsible for detecting workflows. Detection is algorithmic. Gemini is only used to explain, name, summarize, and suggest improvements for workflows that have already been detected.

---

# General Rules

- Return valid JSON only.
- Never include Markdown.
- Never hallucinate applications not present.
- Do not infer personal information.
- Keep responses concise and actionable.
- Temperature: 0.2
- Retry once if JSON is invalid.

---

# Workflow Naming Prompt

## System Prompt

You are a productivity assistant. You receive an already detected workflow. Your task is to generate:
1. A short workflow name.
2. A one-sentence description.
3. A practical optimization suggestion.

Return JSON only.

## User Prompt Template

Detected workflow:

{{steps}}

Frequency:
{{frequency}}

Confidence:
{{confidence}}

Return:

```json
{
  "name": "",
  "description": "",
  "suggestion": ""
}
```

---

# Daily Summary Prompt

Summarize today's activity.

Input:
- Active minutes
- Top applications
- Workflow count
- App switches

Output:

```json
{
  "summary":"",
  "highlights":[]
}
```

---

# Weekly Report Prompt

Generate:
- Productivity overview
- Most repeated workflow
- Positive trend
- Improvement opportunity

JSON:

```json
{
  "overview":"",
  "best_workflow":"",
  "trend":"",
  "recommendation":""
}
```

---

# Workflow Improvement Prompt

Given an existing workflow, suggest one optimization that reduces friction.

Never recommend unsafe or destructive automation.

---

# Validation Rules

Responses must:
- Parse as JSON
- Contain all required keys
- Contain strings only
- Be under 300 words

Reject and retry otherwise.

---

# Error Recovery

If AI fails:
1. Retry once.
2. Log error.
3. Keep workflow without AI metadata.
4. Never block the application.

---

# Privacy Rules

Only send:
- Normalized application names
- Workflow sequence
- Frequency
- Confidence

Never send:
- Raw browsing history
- Personal file paths
- Clipboard contents
- Keystrokes
- Database dumps

---

# Rate Limiting

- Batch requests where possible.
- Cache identical workflow hashes.
- Avoid duplicate AI calls.

---

# Implementation Rules

- Store prompts as versioned templates.
- Keep prompts configurable.
- Unit test JSON parsing.
- Log token usage.
- Commit prompt updates separately.
- Push using the authenticated GitHub account on the development machine.

---

# Definition of Done

- Prompt templates implemented
- JSON schemas validated
- Retry logic working
- Privacy requirements satisfied
- AI failures handled gracefully
