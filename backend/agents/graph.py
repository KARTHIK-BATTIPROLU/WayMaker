from langgraph.graph import StateGraph, START, END
from agents.state import OrchestratorState
from agents.nodes.web_search import web_search_node
from agents.nodes.market_research import market_research_node
from agents.nodes.competitors import competitors_node
from agents.nodes.website import website_node
from agents.nodes.marketing import marketing_node
from agents.nodes.funding import funding_node

def build_graph():
    graph = StateGraph(OrchestratorState)

    # Add all nodes
    graph.add_node("web_search_node", web_search_node)
    graph.add_node("market_research_node", market_research_node)
    graph.add_node("competitors_node", competitors_node)
    graph.add_node("website_node", website_node)
    graph.add_node("marketing_node", marketing_node)
    graph.add_node("funding_node", funding_node)

    # Sequential flow to avoid Groq rate limit (429 Too Many Requests)
    graph.add_edge(START, "web_search_node")
    graph.add_edge("web_search_node", "market_research_node")
    graph.add_edge("market_research_node", "competitors_node")
    graph.add_edge("competitors_node", "website_node")
    graph.add_edge("website_node", "marketing_node")
    graph.add_edge("marketing_node", "funding_node")
    graph.add_edge("funding_node", END)

    return graph.compile()

orchestrator = build_graph()
