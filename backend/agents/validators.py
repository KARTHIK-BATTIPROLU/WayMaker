import logging
from typing import Awaitable, Callable, Literal
from agents.prompts import RESEARCH_DISCLAIMER

logger = logging.getLogger(__name__)

SchemaName = Literal["market", "competitor", "customer"]


def _disclaimer_block(data: dict) -> list[str]:
    disclaimer = (data or {}).get("disclaimer")
    if not disclaimer or disclaimer.strip() != RESEARCH_DISCLAIMER.strip():
        return ["disclaimer is missing or was modified from the required exact text"]
    return []


def _validate_market(data: dict) -> tuple[list[str], list[str]]:
    blocks, warns = [], []
    if not isinstance(data, dict):
        return ["output is not a JSON object"], []

    attractiveness = data.get("attractiveness") or {}
    if attractiveness.get("overall") is None:
        blocks.append("attractiveness.overall is missing")

    tam = data.get("tam") or {}
    if tam.get("methodology") == "top_down" and not tam.get("source_urls"):
        blocks.append("tam.source_urls is empty while methodology is top_down")

    blocks += _disclaimer_block(data)

    confidence = data.get("confidence_overall")
    if confidence == "LOW" and not data.get("data_gaps"):
        warns.append("confidence_overall is LOW but data_gaps is empty")

    return blocks, warns


def _validate_competitor(data: dict) -> tuple[list[str], list[str]]:
    blocks, warns = [], []
    if not isinstance(data, dict):
        return ["output is not a JSON object"], []

    competitors = data.get("competitors") or []
    if len(competitors) < 3:
        blocks.append(f"competitors has {len(competitors)} entries, need at least 3")

    for c in competitors:
        sources = c.get("sources") or []
        if not sources:
            blocks.append(f"competitor '{c.get('name', '?')}' has no sources")
            continue
        if any(not s.get("verified", False) for s in sources):
            blocks.append(f"competitor '{c.get('name', '?')}' has an unverified source")

    if len(data.get("opportunities") or []) < 2:
        blocks.append("opportunities has fewer than 2 entries")

    blocks += _disclaimer_block(data)
    return blocks, warns


def _validate_customer(data: dict) -> tuple[list[str], list[str]]:
    blocks, warns = [], []
    if not isinstance(data, dict):
        return ["output is not a JSON object"], []

    communities = [c for c in (data.get("communities") or []) if c.get("verified")]
    if len(communities) < 5:
        blocks.append(f"only {len(communities)} verified communities, need at least 5")

    framework = data.get("interview_framework") or {}
    question_count = sum(
        len(framework.get(key) or [])
        for key in ("discovery_questions", "problem_questions", "willingness_to_pay_questions")
    )
    if question_count < 15:
        blocks.append(f"interview_framework has {question_count} total questions, need at least 15")

    for entry in data.get("seven_day_plan") or []:
        task = entry.get("task", "")
        if len(task.split()) <= 10:
            blocks.append(f"seven_day_plan day {entry.get('day', '?')} task is too short (<=10 words)")

    blocks += _disclaimer_block(data)

    for template in data.get("outreach_templates") or []:
        if "we have built" in template.get("body", "").lower() or "we've built" in template.get("body", "").lower():
            warns.append(f"outreach template ({template.get('channel', '?')}) contains pitch language ('we have built')")

    return blocks, warns


_VALIDATORS: dict[SchemaName, Callable[[dict], tuple[list[str], list[str]]]] = {
    "market": _validate_market,
    "competitor": _validate_competitor,
    "customer": _validate_customer,
}


def validate_module_output(schema_name: SchemaName, data: dict) -> dict:
    blocks, warns = _VALIDATORS[schema_name](data)
    return {"ok": len(blocks) == 0, "blocks": blocks, "warns": warns}


async def run_with_validation(
    synthesize_fn: Callable[[str], Awaitable[dict]],
    schema_name: SchemaName,
    base_prompt_suffix: str = "",
) -> tuple[dict, str]:
    """Calls synthesize_fn(prompt_suffix) -> dict, validates it, and retries once on BLOCK
    with the block list appended as a corrective instruction. Returns (data, status) where
    status is "ok" or "partial". WARNs never block; they're returned to the caller via the
    data dict's own structure (synthesize_fn output keeps them, validators just collects them
    for the caller to store as flags[])."""
    data = await synthesize_fn(base_prompt_suffix)
    result = validate_module_output(schema_name, data)

    if result["ok"]:
        return data, "ok"

    logger.warning(f"run_with_validation: {schema_name} BLOCKED on first attempt: {result['blocks']}")
    corrective = (
        f"{base_prompt_suffix}\n\nYour previous output was rejected for these reasons — fix them "
        f"and return corrected JSON: {'; '.join(result['blocks'])}"
    )
    data = await synthesize_fn(corrective)
    result = validate_module_output(schema_name, data)

    if result["ok"]:
        return data, "ok"

    logger.warning(f"run_with_validation: {schema_name} BLOCKED again after retry: {result['blocks']}")
    if isinstance(data, dict):
        data["confidence_overall"] = "LOW"
        data["flags"] = result["blocks"]
    return data, "partial"
