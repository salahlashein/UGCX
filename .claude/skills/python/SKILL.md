---
name: python
description: Python, Django, PyTorch, and LangChain development patterns, testing, and security best practices.
---


# Python Ecosystem Development Patterns


Comprehensive guidelines for Python applications, Django web frameworks, PyTorch deep learning, and LangChain integration.


## When to Activate


- Designing or refactoring Python applications, packages, scripts
- Working with Django web applications, REST APIs, or DRF
- Configuring security, authentication, and authorization
- Writing tests using pytest, factory_boy, or doing TDD
- Building PyTorch models or data pipelines
- Implementing LangChain orchestrations, LLM chains, or vector stores


## Core Python Principles


- **Readability & Explicitness:** Favor clear, idiomatic code over cleverness (EAFP over LBYL).
- **Type Hints:** Use explicit typing (`list[str]`, `dict[str, Any]`, `Protocol`) for robust APIs.
- **Resource Management:** Always use context managers (`with` statements) for I/O and DB transactions.
- **Memory Efficiency:** Use generators for large data iteration and `__slots__` for heavily instantiated classes.
- **Project Structure:** Standardize on `src/` layouts with `pyproject.toml` managing dependencies and tools (Black, Ruff, mypy).


For deeper Python idioms and snippets, see [Python Patterns](./references/python-patterns.md).


## Testing & TDD (Python & Django)


- **Red-Green-Refactor:** Always write failing tests first. Target 80%+ line coverage and 100% critical path coverage.
- **Pytest:** Base testing framework. Use `@pytest.fixture` for setup, `conftest.py` for shared fixtures, and `@pytest.mark.parametrize` for data variations.
- **Mocking:** Use `unittest.mock.patch` for external services. Do not test external code.
- **Django TDD:** Use `pytest-django`, configure `conftest.py` with `db` fixtures, use `factory_boy` instead of manual creation, and override settings during tests (e.g., `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'`).


For specific mocking examples, fixture strategies, and Django testing flows, see [Testing Patterns](./references/testing.md).


## Django Architecture & Security


- **Project Layout:** Use split settings (`base.py`, `development.py`, `production.py`) and logical app boundaries.
- **Models & ORM:** Avoid N+1 queries (`select_related`, `prefetch_related`). Use custom QuerySets/Managers (`Product.objects.active()`).
- **DRF (Django REST Framework):** Use serializers with strict validation; use ViewSets with discrete actions. Apply service layers for complex business logic.
- **Security Posture:** 
  - Never run `DEBUG = True` in production.
  - Employ robust password hashing (Argon2 or PBKDF2) and strong validation checks.
  - Prevent XSS (rely on Django auto-escaping) and SQLi (always use ORM or parametrized `raw()` queries).
  - Enforce CSRF token requirements on state-changing requests, and use environment variables for keys.


For extended DRF routing, Caching strategies, Signals, and Security configurations, refer to [Django Architecture & Security](./references/django-architecture.md).


## PyTorch Deep Learning


- **Device-Agnostic:** Always use `torch.device`. Never hardcode `.cuda()`.
- **Reproducibility:** Seed everything (`torch.manual_seed`, `np.random.seed`, etc.).
- **Data Loaders:** Optimize with `num_workers`, `pin_memory=True`, and custom `collate_fn` for paddings.
- **Performance Optimization:** Use `torch.amp.autocast` for mixed precision, `gradient_checkpointing` for large models, and `torch.compile` (PyTorch 2.0+). Don't accidentally use `.item()` before `.backward()`.


For exact training loop, validation, and check-pointing patterns, see [PyTorch Patterns](./references/pytorch.md).


## LangChain Orchestration


- **Runnable Interface (LCEL):** Build with LCEL (`prompt | chat_model | output_parser`) using `.invoke()`, `.batch()`, and `.stream()`.
- **Chat Models:** Send typed messages (`SystemMessage`, `HumanMessage`). Use `bind_tools` for tool calling and `with_structured_output` for typed JSON results.
- **Vector Stores:** Normalize document metadata. Use retrievers via pipeline. Prefer managed persistent DBs for production.
- **Security & Tracing:** Treat generated queries and tool outputs as untrusted. Inject run/tag metadata for LangSmith tracing.


For chat model usage, prompt handling, and vector store configurations, see [LangChain Patterns](./references/langchain.md).

