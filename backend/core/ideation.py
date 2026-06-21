# Confidence computation for ideation scores.
# Never computed by the LLM — LLMs are unreliable at gating themselves.

WEIGHTS: dict[str, float] = {
    "problem": 0.30,
    "targetCustomer": 0.25,
    "solutionWedge": 0.20,
    "valueAndWillingness": 0.15,
    "alternatives": 0.10,
}


def compute_confidence(scores: dict) -> int:
    """Weighted average → 0-100 integer."""
    return round(sum(scores.get(k, 0) * w for k, w in WEIGHTS.items()))


def compute_ready(scores: dict, confidence: int) -> bool:
    """
    Ready when overall confidence ≥ 70 AND every single dimension ≥ 50.
    The min() clause prevents a founder sailing through on one great dimension
    while leaving e.g. target customer completely blank.
    """
    return confidence >= 70 and min(scores.values()) >= 50
