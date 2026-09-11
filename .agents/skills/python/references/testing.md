---
name: python-testing
description: Python testing strategies using pytest, TDD methodology, fixtures, mocking, parametrization, and coverage requirements.
---


# Python Testing Patterns


Comprehensive testing strategies for Python applications using pytest, TDD methodology, and best practices.


## When to Activate


- Writing new Python code (follow TDD: red, green, refactor)
- Designing test suites for Python projects
- Reviewing Python test coverage
- Setting up testing infrastructure


## Core Testing Philosophy


### Test-Driven Development (TDD)


Always follow the TDD cycle:


1. **RED**: Write a failing test for the desired behavior
2. **GREEN**: Write minimal code to make the test pass
3. **REFACTOR**: Improve code while keeping tests green


```python
# Step 1: Write failing test (RED)
def test_add_numbers():
        result = add(2, 3)
        assert result == 5


# Step 2: Write minimal implementation (GREEN)
def add(a, b):
        return a + b


# Step 3: Refactor if needed (REFACTOR)
```


### Coverage Requirements


- **Target**: 80%+ code coverage
- **Critical paths**: 100% coverage required
- Use `pytest --cov` to measure coverage


```bash
pytest --cov=mypackage --cov-report=term-missing --cov-report=html
```


## pytest Fundamentals


### Basic Test Structure


```python
import pytest


def test_addition():
        """Test basic addition."""
        assert 2 + 2 == 4


def test_string_uppercase():
        """Test string uppercasing."""
        text = "hello"
        assert text.upper() == "HELLO"


def test_list_append():
        """Test list append."""
        items = [1, 2, 3]
        items.append(4)
        assert 4 in items
        assert len(items) == 4
```


### Assertions


```python
# Equality
assert result == expected


# Inequality
assert result != unexpected


# Truthiness
assert result  # Truthy
assert not result  # Falsy
assert result is True  # Exactly True
assert result is False  # Exactly False
assert result is None  # Exactly None


# Membership
assert item in collection
assert item not in collection


# Comparisons
assert result > 0
assert 0 <= result <= 100


# Type checking
assert isinstance(result, str)


# Exception testing (preferred approach)
with pytest.raises(ValueError):
        raise ValueError("error message")


# Check exception message
with pytest.raises(ValueError, match="invalid input"):
        raise ValueError("invalid input provided")


# Check exception attributes
with pytest.raises(ValueError) as exc_info:
        raise ValueError("error message")
assert str(exc_info.value) == "error message"
```


## Fixtures


### Basic Fixture Usage


```python
import pytest


@pytest.fixture
def sample_data():
        """Fixture providing sample data."""
        return {"name": "Alice", "age": 30}


def test_sample_data(sample_data):
        """Test using the fixture."""
        assert sample_data["name"] == "Alice"
        assert sample_data["age"] == 30
```


### Fixture with Setup/Teardown


```python
@pytest.fixture
def database():
        """Fixture with setup and teardown."""
        # Setup
        db = Database(":memory:")
        db.create_tables()
        db.insert_test_data()


        yield db  # Provide to test


        # Teardown
        db.close()


def test_database_query(database):
        """Test database operations."""
        result = database.query("SELECT * FROM users")
        assert len(result) > 0
```


### Fixture Scopes


```python
# Function scope (default) - runs for each test
@pytest.fixture
def temp_file():
        with open("temp.txt", "w") as f:
            yield f
        os.remove("temp.txt")


# Module scope - runs once per module
@pytest.fixture(scope="module")
def module_db():
        db = Database(":memory:")
        db.create_tables()
        yield db
        db.close()


# Session scope - runs once per test session
@pytest.fixture(scope="session")
def shared_resource():
        resource = ExpensiveResource()
        yield resource
        resource.cleanup()
```


### Fixture with Parameters


```python
@pytest.fixture(params=[1, 2, 3])
def number(request):
        """Parameterized fixture."""
        return request.param


def test_numbers(number):
        """Test runs 3 times, once for each parameter."""
        assert number > 0
```


### Using Multiple Fixtures


```python
@pytest.fixture
def user():
        return User(id=1, name="Alice")


@pytest.fixture
def admin():
        return User(id=2, name="Admin", role="admin")


def test_user_admin_interaction(user, admin):
        """Test using multiple fixtures."""
        assert admin.can_manage(user)
```


### Autouse Fixtures


```python
@pytest.fixture(autouse=True)
def reset_config():
        """Automatically runs before every test."""
        Config.reset()
        yield
        Config.cleanup()


def test_without_fixture_call():
        # reset_config runs automatically
        assert Config.get_setting("debug") is False
```


### Conftest.py for Shared Fixtures


```python
# tests/conftest.py
import pytest


@pytest.fixture
def client():
        """Shared fixture for all tests."""
        app = create_app(testing=True)
        with app.test_client() as client:
            yield client


@pytest.fixture
def auth_headers(client):
        """Generate auth headers for API testing."""
        response = client.post("/api/login", json={
            "username": "test",
            "password": "test"
        })
        token = response.json["token"]
        return {"Authorization": f"Bearer {token}"}
```


## Parametrization


### Basic Parametrization


```python
@pytest.mark.parametrize("input,expected", [
        ("hello", "HELLO"),
        ("world", "WORLD"),
        ("PyThOn", "PYTHON"),
])
def test_uppercase(input, expected):
        """Test runs 3 times with different inputs."""
        assert input.upper() == expected
```


### Multiple Parameters


```python
@pytest.mark.parametrize("a,b,expected", [
        (2, 3, 5),
        (0, 0, 0),
        (-1, 1, 0),
        (100, 200, 300),
])
def test_add(a, b, expected):
        """Test addition with multiple inputs."""
        assert add(a, b) == expected
```


### Parametrize with IDs


```python
@pytest.mark.parametrize("input,expected", [
        ("valid@email.com", True),
        ("invalid", False),
        ("@no-domain.com", False),
], ids=["valid-email", "missing-at", "missing-domain"])
def test_email_validation(input, expected):
        """Test email validation with readable test IDs."""
        assert is_valid_email(input) is expected
```


### Parametrized Fixtures


```python
@pytest.fixture(params=["sqlite", "postgresql", "mysql"])
def db(request):
        """Test against multiple database backends."""
        if request.param == "sqlite":
            return Database(":memory:")
        elif request.param == "postgresql":
            return Database("postgresql://localhost/test")
        elif request.param == "mysql":
            return Database("mysql://localhost/test")


def test_database_operations(db):
        """Test runs 3 times, once for each database."""
        result = db.query("SELECT 1")
        assert result is not None
```


## Markers and Test Selection


### Custom Markers


```python
# Mark slow tests
@pytest.mark.slow
def test_slow_operation():
        time.sleep(5)


# Mark integration tests
@pytest.mark.integration
def test_api_integration():
        response = requests.get("https://api.example.com")
        assert response.status_code == 200


# Mark unit tests
@pytest.mark.unit
def test_unit_logic():
        assert calculate(2, 3) == 5
```


### Run Specific Tests


```bash
# Run only fast tests
pytest -m "not slow"


# Run only integration tests
pytest -m integration


# Run integration or slow tests
pytest -m "integration or slow"


# Run tests marked as unit but not slow
pytest -m "unit and not slow"
```


### Configure Markers in pytest.ini


```ini
[pytest]
markers =
        slow: marks tests as slow
        integration: marks tests as integration tests
        unit: marks tests as unit tests
        django: marks tests as requiring Django
```


## Mocking and Patching


### Mocking Functions


```python
from unittest.mock import patch, Mock


@patch("mypackage.external_api_call")
def test_with_mock(api_call_mock):
        """Test with mocked external API."""
        api_call_mock.return_value = {"status": "success"}


        result = my_function()


        api_call_mock.assert_called_once()
        assert result["status"] == "success"
```


### Mocking Return Values


```python
@patch("mypackage.Database.connect")
def test_database_connection(connect_mock):
        """Test with mocked database connection."""
        connect_mock.return_value = MockConnection()


        db = Database()
        db.connect()


        connect_mock.assert_called_once_with("localhost")
```


### Mocking Exceptions


```python
@patch("mypackage.api_call")
def test_api_error_handling(api_call_mock):
        """Test error handling with mocked exception."""
        api_call_mock.side_effect = ConnectionError("Network error")


        with pytest.raises(ConnectionError):
            api_call()


        api_call_mock.assert_called_once()
```


### Mocking Context Managers


```python
@patch("builtins.open", new_callable=mock_open)
def test_file_reading(mock_file):
        """Test file reading with mocked open."""
        mock_file.return_value.read.return_value = "file content"


        result = read_file("test.txt")


        mock_file.assert_called_once_with("test.txt", "r")
        assert result == "file content"
```


### Using Autospec


```python
@patch("mypackage.DBConnection", autospec=True)
def test_autospec(db_mock):
        """Test with autospec to catch API misuse."""
        db = db_mock.return_value
        db.query("SELECT * FROM users")


        # This would fail if DBConnection doesn't have query method
        db_mock.assert_called_once()
```


### Mock Class Instances


```python
class TestUserService:
        @patch("mypackage.UserRepository")
        def test_create_user(self, repo_mock):
            """Test user creation with mocked repository."""
            repo_mock.return_value.save.return_value = User(id=1, name="Alice")


            service = UserService(repo_mock.return_value)
            user = service.create_user(name="Alice")


            assert user.name == "Alice"
            repo_mock.return_value.save.assert_called_once()
```


### Mock Property


```python
@pytest.fixture
def mock_config():
        """Create a mock with a property."""
        config = Mock()
        type(config).debug = PropertyMock(return_value=True)
        type(config).api_key = PropertyMock(return_value="test-key")
        return config


def test_with_mock_config(mock_config):
        """Test with mocked config properties."""
        assert mock_config.debug is True
        assert mock_config.api_key == "test-key"
```


## Testing Async Code


### Async Tests with pytest-asyncio


```python
import pytest


@pytest.mark.asyncio
async def test_async_function():
        """Test async function."""
        result = await async_add(2, 3)
        assert result == 5


@pytest.mark.asyncio
async def test_async_with_fixture(async_client):
        """Test async with async fixture."""
        response = await async_client.get("/api/users")
        assert response.status_code == 200
```


### Async Fixture


```python
@pytest.fixture
async def async_client():
        """Async fixture providing async test client."""
        app = create_app()
        async with app.test_client() as client:
            yield client


@pytest.mark.asyncio
async def test_api_endpoint(async_client):
        """Test using async fixture."""
        response = await async_client.get("/api/data")
        assert response.status_code == 200
```


### Mocking Async Functions


```python
@pytest.mark.asyncio
@patch("mypackage.async_api_call")
async def test_async_mock(api_call_mock):
        """Test async function with mock."""
        api_call_mock.return_value = {"status": "ok"}


        result = await my_async_function()


        api_call_mock.assert_awaited_once()
        assert result["status"] == "ok"
```


## Testing Exceptions


### Testing Expected Exceptions


```python
def test_divide_by_zero():
        """Test that dividing by zero raises ZeroDivisionError."""
        with pytest.raises(ZeroDivisionError):
            divide(10, 0)


def test_custom_exception():
        """Test custom exception with message."""
        with pytest.raises(ValueError, match="invalid input"):
            validate_input("invalid")
```


### Testing Exception Attributes


```python
def test_exception_with_details():
        """Test exception with custom attributes."""
        with pytest.raises(CustomError) as exc_info:
            raise CustomError("error", code=400)


        assert exc_info.value.code == 400
        assert "error" in str(exc_info.value)
```


## Testing Side Effects


### Testing File Operations


```python
import tempfile
import os


def test_file_processing():
        """Test file processing with temp file."""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write("test content")
            temp_path = f.name


        try:
            result = process_file(temp_path)
            assert result == "processed: test content"
        finally:
            os.unlink(temp_path)
```


### Testing with pytest's tmp_path Fixture


```python
def test_with_tmp_path(tmp_path):
        """Test using pytest's built-in temp path fixture."""
        test_file = tmp_path / "test.txt"
        test_file.write_text("hello world")


        result = process_file(str(test_file))
        assert result == "hello world"
        # tmp_path automatically cleaned up
```


### Testing with tmpdir Fixture


```python
def test_with_tmpdir(tmpdir):
        """Test using pytest's tmpdir fixture."""
        test_file = tmpdir.join("test.txt")
        test_file.write("data")


        result = process_file(str(test_file))
        assert result == "data"
```


## Test Organization


### Directory Structure


```
tests/
├── conftest.py                     # Shared fixtures
├── __init__.py
├── unit/                           # Unit tests
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_utils.py
│   └── test_services.py
├── integration/                    # Integration tests
│   ├── __init__.py
│   ├── test_api.py
│   └── test_database.py
└── e2e/                            # End-to-end tests
        ├── __init__.py
        └── test_user_flow.py
```


### Test Classes


```python
class TestUserService:
        """Group related tests in a class."""


        @pytest.fixture(autouse=True)
        def setup(self):
            """Setup runs before each test in this class."""
            self.service = UserService()


        def test_create_user(self):
            """Test user creation."""
            user = self.service.create_user("Alice")
            assert user.name == "Alice"


        def test_delete_user(self):
            """Test user deletion."""
            user = User(id=1, name="Bob")
            self.service.delete_user(user)
            assert not self.service.user_exists(1)
```


## Best Practices


### DO


- **Follow TDD**: Write tests before code (red-green-refactor)
- **Test one thing**: Each test should verify a single behavior
- **Use descriptive names**: `test_user_login_with_invalid_credentials_fails`
- **Use fixtures**: Eliminate duplication with fixtures
- **Mock external dependencies**: Don't depend on external services
- **Test edge cases**: Empty inputs, None values, boundary conditions
- **Aim for 80%+ coverage**: Focus on critical paths
- **Keep tests fast**: Use marks to separate slow tests


### DON'T


- **Don't test implementation**: Test behavior, not internals
- **Don't use complex conditionals in tests**: Keep tests simple
- **Don't ignore test failures**: All tests must pass
- **Don't test third-party code**: Trust libraries to work
- **Don't share state between tests**: Tests should be independent
- **Don't catch exceptions in tests**: Use `pytest.raises`
- **Don't use print statements**: Use assertions and pytest output
- **Don't write tests that are too brittle**: Avoid over-specific mocks


## Common Patterns


### Testing API Endpoints (FastAPI/Flask)


```python
@pytest.fixture
def client():
        app = create_app(testing=True)
        return app.test_client()


def test_get_user(client):
        response = client.get("/api/users/1")
        assert response.status_code == 200
        assert response.json["id"] == 1


def test_create_user(client):
        response = client.post("/api/users", json={
            "name": "Alice",
            "email": "alice@example.com"
        })
        assert response.status_code == 201
        assert response.json["name"] == "Alice"
```


### Testing Database Operations


```python
@pytest.fixture
def db_session():
        """Create a test database session."""
        session = Session(bind=engine)
        session.begin_nested()
        yield session
        session.rollback()
        session.close()


def test_create_user(db_session):
        user = User(name="Alice", email="alice@example.com")
        db_session.add(user)
        db_session.commit()


        retrieved = db_session.query(User).filter_by(name="Alice").first()
        assert retrieved.email == "alice@example.com"
```


### Testing Class Methods


```python
class TestCalculator:
        @pytest.fixture
        def calculator(self):
            return Calculator()


        def test_add(self, calculator):
            assert calculator.add(2, 3) == 5


        def test_divide_by_zero(self, calculator):
            with pytest.raises(ZeroDivisionError):
                calculator.divide(10, 0)
```


## pytest Configuration


### pytest.ini


```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
        --strict-markers
        --disable-warnings
        --cov=mypackage
        --cov-report=term-missing
        --cov-report=html
markers =
        slow: marks tests as slow
        integration: marks tests as integration tests
        unit: marks tests as unit tests
```


### pyproject.toml


```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
        "--strict-markers",
        "--cov=mypackage",
        "--cov-report=term-missing",
        "--cov-report=html",
]
markers = [
        "slow: marks tests as slow",
        "integration: marks tests as integration tests",
        "unit: marks tests as unit tests",
]
```


## Running Tests


```bash
# Run all tests
pytest


# Run specific file
pytest tests/test_utils.py


# Run specific test
pytest tests/test_utils.py::test_function


# Run with verbose output
pytest -v


# Run with coverage
pytest --cov=mypackage --cov-report=html


# Run only fast tests
pytest -m "not slow"


# Run until first failure
pytest -x


# Run and stop on N failures
pytest --maxfail=3


# Run last failed tests
pytest --lf


# Run tests with pattern
pytest -k "test_user"


# Run with debugger on failure
pytest --pdb
```


## Quick Reference


| Pattern | Usage |
|---------|-------|
| `pytest.raises()` | Test expected exceptions |
| `@pytest.fixture()` | Create reusable test fixtures |
| `@pytest.mark.parametrize()` | Run tests with multiple inputs |
| `@pytest.mark.slow` | Mark slow tests |
| `pytest -m "not slow"` | Skip slow tests |
| `@patch()` | Mock functions and classes |
| `tmp_path` fixture | Automatic temp directory |
| `pytest --cov` | Generate coverage report |
| `assert` | Simple and readable assertions |


**Remember**: Tests are code too. Keep them clean, readable, and maintainable. Good tests catch bugs; great tests prevent them.




---
name: django-tdd
description: Django testing strategies with pytest-django, TDD methodology, factory_boy, mocking, coverage, and testing Django REST Framework APIs.
---


# Django Testing with TDD


Test-driven development for Django applications using pytest, factory_boy, and Django REST Framework.


## When to Activate


- Writing new Django applications
- Implementing Django REST Framework APIs
- Testing Django models, views, and serializers
- Setting up testing infrastructure for Django projects


## TDD Workflow for Django


### Red-Green-Refactor Cycle


```python
# Step 1: RED - Write failing test
def test_user_creation():
        user = User.objects.create_user(email='test@example.com', password='testpass123')
        assert user.email == 'test@example.com'
        assert user.check_password('testpass123')
        assert not user.is_staff


# Step 2: GREEN - Make test pass
# Create User model or factory


# Step 3: REFACTOR - Improve while keeping tests green
```


## Setup


### pytest Configuration


```ini
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.test
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
        --reuse-db
        --nomigrations
        --cov=apps
        --cov-report=html
        --cov-report=term-missing
        --strict-markers
markers =
        slow: marks tests as slow
        integration: marks tests as integration tests
```


### Test Settings


```python
# config/settings/test.py
from .base import *


DEBUG = True
DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
}


# Disable migrations for speed
class DisableMigrations:
        def __contains__(self, item):
            return True


        def __getitem__(self, item):
            return None


MIGRATION_MODULES = DisableMigrations()


# Faster password hashing
PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.MD5PasswordHasher',
]


# Email backend
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# Celery always eager
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
```


### conftest.py


```python
# tests/conftest.py
import pytest
from django.utils import timezone
from django.contrib.auth import get_user_model


User = get_user_model()


@pytest.fixture(autouse=True)
def timezone_settings(settings):
        """Ensure consistent timezone."""
        settings.TIME_ZONE = 'UTC'


@pytest.fixture
def user(db):
        """Create a test user."""
        return User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser'
        )


@pytest.fixture
def admin_user(db):
        """Create an admin user."""
        return User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            username='admin'
        )


@pytest.fixture
def authenticated_client(client, user):
        """Return authenticated client."""
        client.force_login(user)
        return client


@pytest.fixture
def api_client():
        """Return DRF API client."""
        from rest_framework.test import APIClient
        return APIClient()


@pytest.fixture
def authenticated_api_client(api_client, user):
        """Return authenticated API client."""
        api_client.force_authenticate(user=user)
        return api_client
```


## Factory Boy


### Factory Setup


```python
# tests/factories.py
import factory
from factory import fuzzy
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from apps.products.models import Product, Category


User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
        """Factory for User model."""


        class Meta:
            model = User


        email = factory.Sequence(lambda n: f"user{n}@example.com")
        username = factory.Sequence(lambda n: f"user{n}")
        password = factory.PostGenerationMethodCall('set_password', 'testpass123')
        first_name = factory.Faker('first_name')
        last_name = factory.Faker('last_name')
        is_active = True


class CategoryFactory(factory.django.DjangoModelFactory):
        """Factory for Category model."""


        class Meta:
            model = Category


        name = factory.Faker('word')
        slug = factory.LazyAttribute(lambda obj: obj.name.lower())
        description = factory.Faker('text')


class ProductFactory(factory.django.DjangoModelFactory):
        """Factory for Product model."""


        class Meta:
            model = Product


        name = factory.Faker('sentence', nb_words=3)
        slug = factory.LazyAttribute(lambda obj: obj.name.lower().replace(' ', '-'))
        description = factory.Faker('text')
        price = fuzzy.FuzzyDecimal(10.00, 1000.00, 2)
        stock = fuzzy.FuzzyInteger(0, 100)
        is_active = True
        category = factory.SubFactory(CategoryFactory)
        created_by = factory.SubFactory(UserFactory)


        @factory.post_generation
        def tags(self, create, extracted, **kwargs):
            """Add tags to product."""
            if not create:
                return
            if extracted:
                for tag in extracted:
                    self.tags.add(tag)
```


### Using Factories


```python
# tests/test_models.py
import pytest
from tests.factories import ProductFactory, UserFactory


def test_product_creation():
        """Test product creation using factory."""
        product = ProductFactory(price=100.00, stock=50)
        assert product.price == 100.00
        assert product.stock == 50
        assert product.is_active is True


def test_product_with_tags():
        """Test product with tags."""
        tags = [TagFactory(name='electronics'), TagFactory(name='new')]
        product = ProductFactory(tags=tags)
        assert product.tags.count() == 2


def test_multiple_products():
        """Test creating multiple products."""
        products = ProductFactory.create_batch(10)
        assert len(products) == 10
```


## Model Testing


### Model Tests


```python
# tests/test_models.py
import pytest
from django.core.exceptions import ValidationError
from tests.factories import UserFactory, ProductFactory


class TestUserModel:
        """Test User model."""


        def test_create_user(self, db):
            """Test creating a regular user."""
            user = UserFactory(email='test@example.com')
            assert user.email == 'test@example.com'
            assert user.check_password('testpass123')
            assert not user.is_staff
            assert not user.is_superuser


        def test_create_superuser(self, db):
            """Test creating a superuser."""
            user = UserFactory(
                email='admin@example.com',
                is_staff=True,
                is_superuser=True
            )
            assert user.is_staff
            assert user.is_superuser


        def test_user_str(self, db):
            """Test user string representation."""
            user = UserFactory(email='test@example.com')
            assert str(user) == 'test@example.com'


class TestProductModel:
        """Test Product model."""


        def test_product_creation(self, db):
            """Test creating a product."""
            product = ProductFactory()
            assert product.id is not None
            assert product.is_active is True
            assert product.created_at is not None


        def test_product_slug_generation(self, db):
            """Test automatic slug generation."""
            product = ProductFactory(name='Test Product')
            assert product.slug == 'test-product'


        def test_product_price_validation(self, db):
            """Test price cannot be negative."""
            product = ProductFactory(price=-10)
            with pytest.raises(ValidationError):
                product.full_clean()


        def test_product_manager_active(self, db):
            """Test active manager method."""
            ProductFactory.create_batch(5, is_active=True)
            ProductFactory.create_batch(3, is_active=False)


            active_count = Product.objects.active().count()
            assert active_count == 5


        def test_product_stock_management(self, db):
            """Test stock management."""
            product = ProductFactory(stock=10)
            product.reduce_stock(5)
            product.refresh_from_db()
            assert product.stock == 5


            with pytest.raises(ValueError):
                product.reduce_stock(10)  # Not enough stock
```


## View Testing


### Django View Testing


```python
# tests/test_views.py
import pytest
from django.urls import reverse
from tests.factories import ProductFactory, UserFactory


class TestProductViews:
        """Test product views."""


        def test_product_list(self, client, db):
            """Test product list view."""
            ProductFactory.create_batch(10)


            response = client.get(reverse('products:list'))


            assert response.status_code == 200
            assert len(response.context['products']) == 10


        def test_product_detail(self, client, db):
            """Test product detail view."""
            product = ProductFactory()


            response = client.get(reverse('products:detail', kwargs={'slug': product.slug}))


            assert response.status_code == 200
            assert response.context['product'] == product


        def test_product_create_requires_login(self, client, db):
            """Test product creation requires authentication."""
            response = client.get(reverse('products:create'))


            assert response.status_code == 302
            assert response.url.startswith('/accounts/login/')


        def test_product_create_authenticated(self, authenticated_client, db):
            """Test product creation as authenticated user."""
            response = authenticated_client.get(reverse('products:create'))


            assert response.status_code == 200


        def test_product_create_post(self, authenticated_client, db, category):
            """Test creating a product via POST."""
            data = {
                'name': 'Test Product',
                'description': 'A test product',
                'price': '99.99',
                'stock': 10,
                'category': category.id,
            }


            response = authenticated_client.post(reverse('products:create'), data)


            assert response.status_code == 302
            assert Product.objects.filter(name='Test Product').exists()
```


## DRF API Testing


### Serializer Testing


```python
# tests/test_serializers.py
import pytest
from rest_framework.exceptions import ValidationError
from apps.products.serializers import ProductSerializer
from tests.factories import ProductFactory


class TestProductSerializer:
        """Test ProductSerializer."""


        def test_serialize_product(self, db):
            """Test serializing a product."""
            product = ProductFactory()
            serializer = ProductSerializer(product)


            data = serializer.data


            assert data['id'] == product.id
            assert data['name'] == product.name
            assert data['price'] == str(product.price)


        def test_deserialize_product(self, db):
            """Test deserializing product data."""
            data = {
                'name': 'Test Product',
                'description': 'Test description',
                'price': '99.99',
                'stock': 10,
                'category': 1,
            }


            serializer = ProductSerializer(data=data)


            assert serializer.is_valid()
            product = serializer.save()


            assert product.name == 'Test Product'
            assert float(product.price) == 99.99


        def test_price_validation(self, db):
            """Test price validation."""
            data = {
                'name': 'Test Product',
                'price': '-10.00',
                'stock': 10,
            }


            serializer = ProductSerializer(data=data)


            assert not serializer.is_valid()
            assert 'price' in serializer.errors


        def test_stock_validation(self, db):
            """Test stock cannot be negative."""
            data = {
                'name': 'Test Product',
                'price': '99.99',
                'stock': -5,
            }


            serializer = ProductSerializer(data=data)


            assert not serializer.is_valid()
            assert 'stock' in serializer.errors
```


### API ViewSet Testing


```python
# tests/test_api.py
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from tests.factories import ProductFactory, UserFactory


class TestProductAPI:
        """Test Product API endpoints."""


        @pytest.fixture
        def api_client(self):
            """Return API client."""
            return APIClient()


        def test_list_products(self, api_client, db):
            """Test listing products."""
            ProductFactory.create_batch(10)


            url = reverse('api:product-list')
            response = api_client.get(url)


            assert response.status_code == status.HTTP_200_OK
            assert response.data['count'] == 10


        def test_retrieve_product(self, api_client, db):
            """Test retrieving a product."""
            product = ProductFactory()


            url = reverse('api:product-detail', kwargs={'pk': product.id})
            response = api_client.get(url)


            assert response.status_code == status.HTTP_200_OK
            assert response.data['id'] == product.id


        def test_create_product_unauthorized(self, api_client, db):
            """Test creating product without authentication."""
            url = reverse('api:product-list')
            data = {'name': 'Test Product', 'price': '99.99'}


            response = api_client.post(url, data)


            assert response.status_code == status.HTTP_401_UNAUTHORIZED


        def test_create_product_authorized(self, authenticated_api_client, db):
            """Test creating product as authenticated user."""
            url = reverse('api:product-list')
            data = {
                'name': 'Test Product',
                'description': 'Test',
                'price': '99.99',
                'stock': 10,
            }


            response = authenticated_api_client.post(url, data)


            assert response.status_code == status.HTTP_201_CREATED
            assert response.data['name'] == 'Test Product'


        def test_update_product(self, authenticated_api_client, db):
            """Test updating a product."""
            product = ProductFactory(created_by=authenticated_api_client.user)


            url = reverse('api:product-detail', kwargs={'pk': product.id})
            data = {'name': 'Updated Product'}


            response = authenticated_api_client.patch(url, data)


            assert response.status_code == status.HTTP_200_OK
            assert response.data['name'] == 'Updated Product'


        def test_delete_product(self, authenticated_api_client, db):
            """Test deleting a product."""
            product = ProductFactory(created_by=authenticated_api_client.user)


            url = reverse('api:product-detail', kwargs={'pk': product.id})
            response = authenticated_api_client.delete(url)


            assert response.status_code == status.HTTP_204_NO_CONTENT


        def test_filter_products_by_price(self, api_client, db):
            """Test filtering products by price."""
            ProductFactory(price=50)
            ProductFactory(price=150)


            url = reverse('api:product-list')
            response = api_client.get(url, {'price_min': 100})


            assert response.status_code == status.HTTP_200_OK
            assert response.data['count'] == 1


        def test_search_products(self, api_client, db):
            """Test searching products."""
            ProductFactory(name='Apple iPhone')
            ProductFactory(name='Samsung Galaxy')


            url = reverse('api:product-list')
            response = api_client.get(url, {'search': 'Apple'})


            assert response.status_code == status.HTTP_200_OK
            assert response.data['count'] == 1
```


## Mocking and Patching


### Mocking External Services


```python
# tests/test_views.py
from unittest.mock import patch, Mock
import pytest


class TestPaymentView:
        """Test payment view with mocked payment gateway."""


        @patch('apps.payments.services.stripe')
        def test_successful_payment(self, mock_stripe, client, user, product):
            """Test successful payment with mocked Stripe."""
            # Configure mock
            mock_stripe.Charge.create.return_value = {
                'id': 'ch_123',
                'status': 'succeeded',
                'amount': 9999,
            }


            client.force_login(user)
            response = client.post(reverse('payments:process'), {
                'product_id': product.id,
                'token': 'tok_visa',
            })


            assert response.status_code == 302
            mock_stripe.Charge.create.assert_called_once()


        @patch('apps.payments.services.stripe')
        def test_failed_payment(self, mock_stripe, client, user, product):
            """Test failed payment."""
            mock_stripe.Charge.create.side_effect = Exception('Card declined')


            client.force_login(user)
            response = client.post(reverse('payments:process'), {
                'product_id': product.id,
                'token': 'tok_visa',
            })


            assert response.status_code == 302
            assert 'error' in response.url
```


### Mocking Email Sending


```python
# tests/test_email.py
from django.core import mail
from django.test import override_settings


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
def test_order_confirmation_email(db, order):
        """Test order confirmation email."""
        order.send_confirmation_email()


        assert len(mail.outbox) == 1
        assert order.user.email in mail.outbox[0].to
        assert 'Order Confirmation' in mail.outbox[0].subject
```


## Integration Testing


### Full Flow Testing


```python
# tests/test_integration.py
import pytest
from django.urls import reverse
from tests.factories import UserFactory, ProductFactory


class TestCheckoutFlow:
        """Test complete checkout flow."""


        def test_guest_to_purchase_flow(self, client, db):
            """Test complete flow from guest to purchase."""
            # Step 1: Register
            response = client.post(reverse('users:register'), {
                'email': 'test@example.com',
                'password': 'testpass123',
                'password_confirm': 'testpass123',
            })
            assert response.status_code == 302


            # Step 2: Login
            response = client.post(reverse('users:login'), {
                'email': 'test@example.com',
                'password': 'testpass123',
            })
            assert response.status_code == 302


            # Step 3: Browse products
            product = ProductFactory(price=100)
            response = client.get(reverse('products:detail', kwargs={'slug': product.slug}))
            assert response.status_code == 200


            # Step 4: Add to cart
            response = client.post(reverse('cart:add'), {
                'product_id': product.id,
                'quantity': 1,
            })
            assert response.status_code == 302


            # Step 5: Checkout
            response = client.get(reverse('checkout:review'))
            assert response.status_code == 200
            assert product.name in response.content.decode()


            # Step 6: Complete purchase
            with patch('apps.checkout.services.process_payment') as mock_payment:
                mock_payment.return_value = True
                response = client.post(reverse('checkout:complete'))


            assert response.status_code == 302
            assert Order.objects.filter(user__email='test@example.com').exists()
```


## Testing Best Practices


### DO


- **Use factories**: Instead of manual object creation
- **One assertion per test**: Keep tests focused
- **Descriptive test names**: `test_user_cannot_delete_others_post`
- **Test edge cases**: Empty inputs, None values, boundary conditions
- **Mock external services**: Don't depend on external APIs
- **Use fixtures**: Eliminate duplication
- **Test permissions**: Ensure authorization works
- **Keep tests fast**: Use `--reuse-db` and `--nomigrations`


### DON'T


- **Don't test Django internals**: Trust Django to work
- **Don't test third-party code**: Trust libraries to work
- **Don't ignore failing tests**: All tests must pass
- **Don't make tests dependent**: Tests should run in any order
- **Don't over-mock**: Mock only external dependencies
- **Don't test private methods**: Test public interface
- **Don't use production database**: Always use test database


## Coverage


### Coverage Configuration


```bash
# Run tests with coverage
pytest --cov=apps --cov-report=html --cov-report=term-missing


# Generate HTML report
open htmlcov/index.html
```


### Coverage Goals


| Component | Target Coverage |
|-----------|-----------------|
| Models | 90%+ |
| Serializers | 85%+ |
| Views | 80%+ |
| Services | 90%+ |
| Utilities | 80%+ |
| Overall | 80%+ |


## Quick Reference


| Pattern | Usage |
|---------|-------|
| `@pytest.mark.django_db` | Enable database access |
| `client` | Django test client |
| `api_client` | DRF API client |
| `factory.create_batch(n)` | Create multiple objects |
| `patch('module.function')` | Mock external dependencies |
| `override_settings` | Temporarily change settings |
| `force_authenticate()` | Bypass authentication in tests |
| `assertRedirects` | Check for redirects |
| `assertTemplateUsed` | Verify template usage |
| `mail.outbox` | Check sent emails |


Remember: Tests are documentation. Good tests explain how your code should work. Keep them simple, readable, and maintainable.

