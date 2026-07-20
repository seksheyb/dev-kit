---
name: cohort-analysis
description: Use when analyzing retention, cohort behavior, engagement trends, or understanding how different user groups perform over time. Invoke for retention curve diagnosis, activation metric discovery, and cohort table interpretation. Triggers on "cohort analysis", "retention analysis", "user retention", "cohort retention", "week 1 retention", "retention curve", "activation metric".
license: MIT
metadata:
  version: "1.0.0"
  domain: product-analysis
  triggers: cohort analysis, retention, retention curve, activation metric, aha moment, N-day retention, engagement trends, churn
  role: analyst
  scope: analysis
  output-format: report
  related-skills: ab-test-analysis, growth-loops
---

# Cohort Analysis

Cohort and retention analysis methodology. Understand how groups of users behave over time — identifying retention trends, product improvements, and degradation signals before it's too late to act.

## Types of Cohorts

### Acquisition Cohorts
Group users by when they joined (signup week/month).
Use for: Is the product getting better over time? Are newer cohorts retaining better?

### Behavioral Cohorts
Group users by behavior (e.g., users who used Feature X in first 7 days).
Use for: What behaviors predict retention? What's the activation metric?

### Segment Cohorts
Group users by company size, plan type, or acquisition channel.
Use for: Which segments retain best? Who is the ideal customer?

## Retention Metrics

### N-Day Retention
"What % of users who joined on Day 0 were active on Day N?"
- Day 1 retention: Did they come back the next day?
- Day 7 retention: Did they return after a week?
- Day 30 retention: Do they still see value after a month?

### Rolling Retention
"What % of users who joined in week X were active in week Y or any later week?"
- Measures "did they ever come back after week N?"
- Better for weekly/monthly-use apps

## Retention Curve Diagnosis

```
Healthy: Flattens asymptotically
         |████
         |   █
         |    ███████████████  <- holds at some % forever
         +---------------------- time

Dying:   Continues to slope toward zero
         |████
         |   ████
         |       ████
         |           ████▼   <- approaching 0
         +---------------------- time
```

If the retention curve approaches zero, there is a product-market fit problem — not a growth problem. More acquisition won't fix it.

## Activation Analysis (Finding the "Aha Moment")

Find behaviors that correlate with long-term retention:
1. Identify users with high 30-day retention
2. What did they do in their first 7 days that low-retaining users did NOT do?
3. That behavior = your activation metric candidate

Classic examples:
- Facebook: Add 7 friends in 10 days
- Slack: Send 2,000 messages as a team
- Twitter: Follow 30 users

## Cohort Retention Table Format

```
Cohort     | Week 0 | Week 1 | Week 2 | Week 4 | Week 8
-----------|--------|--------|--------|--------|-------
Jan Cohort | 100%   | 42%    | 31%    | 24%    | 21%
Feb Cohort | 100%   | 45%    | 34%    | 27%    | 24%  <- improving
Mar Cohort | 100%   | 48%    | 37%    | 30%    | 26%  <- improving
```

Improving retention over time = product improvements are working.

## Actionable Outputs from Cohort Analysis

1. **Retention problem diagnosis**: Where does the curve drop fastest?
2. **Activation metric identification**: What behavior predicts retention?
3. **Product improvement tracking**: Are changes actually moving retention?
4. **Segment comparison**: Which customer type retains best?

## Output Format

Deliver:
- Cohort retention table (or structure to build one)
- Retention curve shape diagnosis (healthy / declining / dying)
- Key drop-off points identified with timing
- Activation metric hypothesis with supporting behavioral data
- Product recommendations ranked by expected retention impact
