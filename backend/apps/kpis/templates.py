"""Built-in KPI templates (manufacturing-first, classic OPEX metrics).

Static definitions the frontend offers when creating a KPI; instantiating one
simply pre-fills the create form.
"""

KPI_TEMPLATES = [
    {
        "key": "oee",
        "name": "OEE (Overall Equipment Effectiveness)",
        "unit": "%",
        "direction": "higher",
        "frequency": "daily",
        "description": "Availability × Performance × Quality of equipment.",
    },
    {
        "key": "ftq",
        "name": "First Time Quality",
        "unit": "%",
        "direction": "higher",
        "frequency": "daily",
        "description": "Share of units produced right the first time.",
    },
    {
        "key": "scrap_rate",
        "name": "Scrap Rate",
        "unit": "%",
        "direction": "lower",
        "frequency": "weekly",
        "description": "Scrapped output as a share of total output.",
    },
    {
        "key": "downtime",
        "name": "Unplanned Downtime",
        "unit": "hours",
        "direction": "lower",
        "frequency": "weekly",
        "description": "Unplanned equipment downtime.",
    },
    {
        "key": "otd",
        "name": "On-Time Delivery",
        "unit": "%",
        "direction": "higher",
        "frequency": "monthly",
        "description": "Orders delivered on the promised date.",
    },
    {
        "key": "lead_time",
        "name": "Lead Time",
        "unit": "days",
        "direction": "lower",
        "frequency": "monthly",
        "description": "Order-to-delivery total duration.",
    },
    {
        "key": "cost_per_unit",
        "name": "Cost per Unit",
        "unit": "currency/unit",
        "direction": "lower",
        "frequency": "monthly",
        "description": "Fully loaded production cost per unit.",
    },
    {
        "key": "customer_complaints",
        "name": "Customer Complaints",
        "unit": "count",
        "direction": "lower",
        "frequency": "monthly",
        "description": "Customer complaints received.",
    },
    {
        "key": "man_hours_per_unit",
        "name": "Man-Hours per Unit",
        "unit": "hours/unit",
        "direction": "lower",
        "frequency": "monthly",
        "description": "Direct labor hours per produced unit.",
    },
    {
        "key": "revenue_per_employee",
        "name": "Revenue per Employee",
        "unit": "currency",
        "direction": "higher",
        "frequency": "monthly",
        "description": "Total revenue divided by headcount.",
    },
    {
        "key": "implemented_suggestions",
        "name": "Implemented Suggestions",
        "unit": "count",
        "direction": "higher",
        "frequency": "monthly",
        "description": (
            "Employee improvement suggestions put into practice. "
            "Auto-fed by the continuous improvement module (Phase 2)."
        ),
    },
]
