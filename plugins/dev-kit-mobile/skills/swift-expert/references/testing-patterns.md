# Testing Patterns

## Swift Testing Basics (default for new unit/logic tests)

Swift Testing runs tests in parallel by default and uses macro-based assertions
(`@Test`, `#expect`, `#require`). Prefer it over XCTest for new unit and logic
tests; keep XCTest only for UI tests (`XCUIApplication`) and performance tests
(`measure {}`), which Swift Testing has no equivalent for.

```swift
import Testing
@testable import MyApp

struct UserTests {
    let sut = UserManager()

    @Test func userCreation() {
        let name = "John Doe"
        let email = "john@example.com"

        let user = sut.createUser(name: name, email: email)

        #expect(user.name == name)
        #expect(user.email == email)
        #expect(user.id != nil)
    }

    @Test func validation() throws {
        let user = try #require(sut.findUser(id: 123))
        #expect(user.name == "Test User")
    }
}
```

## Async Testing

```swift
struct AsyncTests {
    @Test func asyncFunction() async throws {
        // Test async/await code directly
        let result = try await fetchData()
        #expect(result.count == 10)
    }

    @Test func asyncSequence() async throws {
        var results: [Int] = []

        for try await value in numberStream() {
            results.append(value)
            if results.count >= 5 {
                break
            }
        }

        #expect(results.count == 5)
    }

    @Test(.timeLimit(.minutes(1))) func withTimeout() async throws {
        try await longRunningOperation()
    }

    @Test func concurrentOperations() async throws {
        async let result1 = fetchData(id: 1)
        async let result2 = fetchData(id: 2)

        let (data1, data2) = try await (result1, result2)

        #expect(data1 != nil)
        #expect(data2 != nil)
    }
}
```

## Mocking

```swift
// Protocol for dependency injection
protocol DataService {
    func fetch(id: Int) async throws -> Data
    func save(_ data: Data) async throws
}

// Production implementation
class APIDataService: DataService {
    func fetch(id: Int) async throws -> Data {
        // Real API call
    }

    func save(_ data: Data) async throws {
        // Real save operation
    }
}

// Mock for testing
class MockDataService: DataService {
    var fetchCalled = false
    var fetchID: Int?
    var fetchResult: Data?
    var fetchError: Error?

    var saveCalled = false
    var savedData: Data?
    var saveError: Error?

    func fetch(id: Int) async throws -> Data {
        fetchCalled = true
        fetchID = id

        if let error = fetchError {
            throw error
        }

        return fetchResult ?? Data()
    }

    func save(_ data: Data) async throws {
        saveCalled = true
        savedData = data

        if let error = saveError {
            throw error
        }
    }
}

// Using mock in tests
struct DataManagerTests {
    @Test func dataFetch() async throws {
        let mockService = MockDataService()
        mockService.fetchResult = "test data".data(using: .utf8)
        let manager = DataManager(service: mockService)

        let result = try await manager.loadData(id: 123)

        #expect(mockService.fetchCalled)
        #expect(mockService.fetchID == 123)
        #expect(result != nil)
    }
}
```

## Test Doubles

```swift
// Spy - records interactions
class SpyDelegate: UserManagerDelegate {
    private(set) var didUpdateUserCalled = false
    private(set) var updatedUser: User?
    private(set) var callCount = 0

    func didUpdateUser(_ user: User) {
        didUpdateUserCalled = true
        updatedUser = user
        callCount += 1
    }
}

// Stub - provides predetermined responses
class StubNetworkService: NetworkService {
    var stubbedResponse: Result<Data, Error> = .success(Data())

    func fetch(url: URL) async throws -> Data {
        try stubbedResponse.get()
    }
}

// Fake - working implementation with shortcuts
class FakeDatabase: Database {
    private var storage: [String: Data] = [:]

    func save(key: String, value: Data) {
        storage[key] = value
    }

    func load(key: String) -> Data? {
        storage[key]
    }

    func clear() {
        storage.removeAll()
    }
}
```

## Performance Testing (XCTest — no Swift Testing equivalent)

```swift
final class PerformanceTests: XCTestCase {
    func testSortingPerformance() {
        let numbers = (0..<10000).shuffled()

        measure {
            _ = numbers.sorted()
        }
    }

    func testCustomMetrics() {
        let metrics: [XCTMetric] = [
            XCTClockMetric(),
            XCTCPUMetric(),
            XCTMemoryMetric(),
            XCTStorageMetric()
        ]

        let options = XCTMeasureOptions()
        options.iterationCount = 10

        measure(metrics: metrics, options: options) {
            performExpensiveOperation()
        }
    }
}
```

## UI Testing (XCTest — no Swift Testing equivalent)

```swift
final class AppUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testLoginFlow() {
        // Test UI interactions
        let emailField = app.textFields["Email"]
        emailField.tap()
        emailField.typeText("test@example.com")

        let passwordField = app.secureTextFields["Password"]
        passwordField.tap()
        passwordField.typeText("password123")

        app.buttons["Login"].tap()

        // Verify navigation
        XCTAssertTrue(app.navigationBars["Dashboard"].exists)
    }

    func testButtonEnabled() {
        let button = app.buttons["Submit"]
        XCTAssertFalse(button.isEnabled)

        app.textFields["Username"].tap()
        app.textFields["Username"].typeText("testuser")

        XCTAssertTrue(button.isEnabled)
    }
}
```

## Testing Actors

```swift
struct ActorTests {
    @Test func actorIsolation() async throws {
        actor Counter {
            private var value = 0

            func increment() -> Int {
                value += 1
                return value
            }

            func reset() {
                value = 0
            }
        }

        let counter = Counter()

        // Test concurrent access
        await withTaskGroup(of: Int.self) { group in
            for _ in 0..<100 {
                group.addTask {
                    await counter.increment()
                }
            }
        }

        let finalValue = await counter.increment()
        #expect(finalValue == 101)
    }
}
```

## Snapshot Testing

```swift
import SnapshotTesting

final class ViewSnapshotTests: XCTestCase {
    func testButtonAppearance() {
        let button = UIButton()
        button.setTitle("Tap Me", for: .normal)
        button.backgroundColor = .blue
        button.frame = CGRect(x: 0, y: 0, width: 200, height: 50)

        assertSnapshot(matching: button, as: .image)
    }

    func testViewControllerLayout() {
        let vc = MyViewController()
        assertSnapshot(matching: vc, as: .image(on: .iPhone13))
    }

    func testDarkMode() {
        let view = MyView()
        assertSnapshot(matching: view, as: .image(traits: .init(userInterfaceStyle: .dark)))
    }
}
```

## Test Organization

```swift
@Suite("User Manager")
struct UserManagerTests {
    @Suite("Creation")
    struct CreationTests {
        @Test func userCreation() { }
        @Test func userCreationWithInvalidData() { }
    }

    @Suite("Validation")
    struct ValidationTests {
        @Test func emailValidation() { }
        @Test func passwordValidation() { }
    }

    @Suite("Persistence")
    struct PersistenceTests {
        @Test func userSave() { }
        @Test func userLoad() { }
    }
}

func makeTestUser() -> User {
    User(name: "Test", email: "test@example.com")
}
```

## Best Practices

- Use `@testable import` to test internal types
- Prefer Swift Testing (`@Test`, `#expect`, `#require`) for new unit/logic tests; reserve XCTest for UI tests and performance tests
- One assertion concept per test (can have multiple `#expect`/`XCTAssert` calls)
- Use Given-When-Then pattern for clarity
- Name test functions descriptively by behavior (`emailValidation`, `userCreationWithInvalidData`)
- Group related tests with `@Suite`; use `init`/`deinit` for setup/teardown in Swift Testing
- Prefer dependency injection for testability
- Use protocols to enable mocking
- Test edge cases and error conditions
- Use async/await for testing async code
- Measure performance with XCTest metrics
- Use UI testing for critical user flows
- Mock external dependencies
- Keep tests fast and independent
- Use test doubles appropriately (mock, stub, spy, fake)
