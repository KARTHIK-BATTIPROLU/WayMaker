from dataclasses import dataclass, field


@dataclass
class ResearchBudget:
    max_search_queries: int = 25
    max_url_fetches: int = 12
    max_tokens: int = 4096
    search_count: int = field(default=0, init=False)
    fetch_count: int = field(default=0, init=False)

    def can_search(self) -> bool:
        return self.search_count < self.max_search_queries

    def can_fetch(self) -> bool:
        return self.fetch_count < self.max_url_fetches

    def note_search(self) -> None:
        self.search_count += 1

    def note_fetch(self) -> None:
        self.fetch_count += 1


def build_budget(hackathon_mode: bool = False) -> ResearchBudget:
    if hackathon_mode:
        return ResearchBudget(max_search_queries=12, max_url_fetches=6)
    return ResearchBudget()
