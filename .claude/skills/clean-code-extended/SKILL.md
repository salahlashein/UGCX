---
name: clean-code-extended
description: Extended, more granular edition of the clean-code checklist (per-check pass/fail/n/a walkthrough) for deep code reviews. Use clean-code for everyday standards; use this when a thorough, exhaustive review is explicitly requested.
---


<!--
  USAGE: Walk through each <section> in order. For every <check>, evaluate the code
  under review and mark status="pass", status="fail", or status="n/a".
  You CANNOT claim code is clean until every applicable check has been verified.
  A single "fail" requires remediation before the review can pass.
-->


<checklist id="clean-code-review" version="2.0">


<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SECTION 1: GENERAL RULES                                                  -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<section id="general-rules" title="General Rules" priority="critical">
  <preamble>
        Code is clean if it can be understood easily by everyone on the team.
        Clean code can be read and enhanced by a developer other than its original author.
        The fundamental measure: is this code easy to change?
  </preamble>


  <check id="GEN-01" status="" summary="Keep it Super Simple">
        Simpler is always better. Reject unnecessary complexity. The simplest solution that works is the best solution. Avoid over-engineering but respect the best practices and patterns.
  </check>


  <check id="GEN-02" status="" summary="Easy to change">
        The fundamental rule of design is code must be easy to change. This is achieved by
        decoupling and abstractions. Ask: "Does this design make it easier or harder to
        change the code in the future?"
  </check>


  <check id="GEN-03" status="" summary="Interface First">
        Generate the interface or abstract base class BEFORE generating concrete implementations.
  </check>


  <check id="GEN-04" status="" summary="Pattern Consistency">
        Apply design patterns consistently across the codebase. If a pattern is used in one
        part, use it in similar situations elsewhere to maintain a consistent design language.
  </check>


  <check id="GEN-05" status="" summary="No commented-out code">
        Don't comment out code. Just remove it. Version control preserves history.
  </check>


  <check id="GEN-06" status="" summary="Comments explain intent, not description">
        Use comments as explanation of intent or code clarification, never as description of
        what the code literally does.
  </check>


  <check id="GEN-07" status="" summary="Unified interfaces for similar classes">
        Alternative classes with different interfaces should be unified. Classes that perform
        similar responsibilities but expose different method signatures must share an interface.
  </check>


  <check id="GEN-08" status="" summary="Async failure handling">
        Failures on async code must have a fallback or graceful degradation strategy. Never let
        an async failure crash the system or leave it in an inconsistent state.
  </check>


  <check id="GEN-09" status="" summary="No optimistic updates without rollback">
        Optimistic fetching or DB updates must have rollback when not in a transactional context.
  </check>
</section>


<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SECTION 2: OOP ARCHITECTURAL PHILOSOPHY                                   -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<section id="oop-architecture" title="Core Architectural Philosophy (OOP)" priority="high">


  <check id="OOP-01" status="" summary="Program to an Interface, not an Implementation">
        Always favor abstract classes or interfaces over concrete implementations.
        Use dependency injection to provide concrete instances.
  </check>


  <check id="OOP-02" status="" summary="Favor Composition over Inheritance">
        Use composition to combine behaviors dynamically at runtime. Avoid deep inheritance
        trees. Use delegation where appropriate to reuse behavior without breaking encapsulation.
  </check>


  <check id="OOP-03" status="" summary="Encapsulate What Varies">
        Identify the aspects of the application that vary and separate them from what stays
        the same. Use patterns like Strategy or State to isolate these variations.
  </check>


  <check id="OOP-04" status="" summary="Loose Coupling">
        Minimize direct dependencies between classes. Use Mediator, Observer, or abstract
        factories to keep components decoupled.
  </check>
</section>


<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SECTION 3: CREATIONAL PATTERNS                                            -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<section id="creational-patterns" title="Creational Patterns Guidelines" priority="medium">
  <preamble>
        When code involves object creation or instantiation, apply these patterns to
        decouple the system from how its objects are created.
  </preamble>


  <check id="CRE-01" status="" summary="Factory pattern for varied instantiation">
        Use Factory when creating multiple instances of objects that have different
        configurations but follow the same interface.
  </check>


  <check id="CRE-02" status="" summary="Singleton used only when essential">
        Use Singleton ONLY when absolutely necessary to guarantee a single instance (e.g.,
        central configuration manager, hardware interface, logger). Prefer Dependency Injection
        over strict Singletons where possible.
  </check>
</section>


<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SECTION 4: STRUCTURAL PATTERNS                                            -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<section id="structural-patterns" title="Structural Patterns Guidelines" priority="medium">
  <preamble>
        When code defines how classes and objects are composed to form larger structures,
        apply these patterns.
  </preamble>


  <check id="STR-01" status="" summary="Adapter for incompatible interfaces">
        Use Adapter to make incompatible interfaces work together. Prefer Object Adapters
        (composition) over Class Adapters (multiple inheritance) for greater flexibility.
  </check>


  <check id="STR-02" status="" summary="Composite for part-whole hierarchies">
        Use Composite to represent part-whole hierarchies. Clients must treat individual
        objects and compositions uniformly via a common Component interface.
  </check>


  <check id="STR-03" status="" summary="Decorator over subclassing">
        Use Decorator to attach additional responsibilities dynamically. Prefer this over
        subclassing to prevent class explosion. The Decorator must have the exact same
        interface as the component it decorates.
  </check>


  <check id="STR-04" status="" summary="Facade for complex subsystems">
        Use Facade to provide a simple, unified interface to a complex subsystem.
  </check>


  <check id="STR-05" status="" summary="Proxy for controlled access">
        Use Proxy to provide a surrogate or placeholder for another object to control access
        (e.g., lazy loading, access control, or remote communication).
  </check>
</section>


<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SECTION 5: BEHAVIORAL PATTERNS                                            -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<section id="behavioral-patterns" title="Behavioral Patterns Guidelines" priority="medium">
  <preamble>
        When code involves algorithms, control flow, or communication between objects,
        apply these patterns.
  </preamble>


  <check id="BHV-01" status="" summary="Strategy eliminates conditional behavior selection">
        Use Strategy to define a family of algorithms, encapsulate each one, and make them
        interchangeable. Eliminate complex conditional logic (switch/if-else) that selects
        behavior by delegating to a Strategy object.
  </check>


  <check id="BHV-02" status="" summary="Observer for one-to-many dependencies">
        Use Observer to define a one-to-many dependency where a change in one object (Subject)
        automatically notifies and updates others (Observers). Keep loosely coupled.
  </check>


  <check id="BHV-03" status="" summary="Command for encapsulated requests">
        Use Command to encapsulate a request as an object. Essential for undo/redo
        functionality, queues, or logging requests.
  </check>


  <check id="BHV-04" status="" summary="State for state-dependent behavior">
        Use State when an object's behavior depends heavily on its internal state and must
        change at runtime. Represent each state as a separate class.
  </check>


  <check id="BHV-05" status="" summary="Chain of Responsibility for handler chains">
        Use Chain of Responsibility to pass a request along a chain of potential handlers
        until one handles it, avoiding coupling the sender to a specific receiver.
  </check>


  <check id="BHV-06" status="" summary="Mediator for complex inter-object communication">
        Use Mediator to centralize complex communications and control logic between objects,
        keeping them from referring to each other explicitly.
  </check>


  <check id="BHV-07" status="" summary="Iterator for sequential access">
        Use Iterator to provide a standard way to sequentially access elements of an
        aggregate without exposing its underlying representation.
  </check>
</section>


<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SECTION 6: SOLID & DESIGN RULES                                           -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<section id="design-rules" title="SOLID Principles and Design Rules" priority="critical">


  <check id="DES-01" status="" summary="Configurable data at high levels">
        Keep configurable data at high levels of the architecture.
  </check>


  <check id="DES-02" status="" summary="Polymorphism over conditionals">
        Prefer polymorphism to if/else or switch/case for behavior selection.
  </check>


  <check id="DES-03" status="" summary="Multi-threading code separated">
        Separate multi-threading code from business logic.
  </check>


  <check id="DES-04" status="" summary="No over-configurability">
        Prevent over-configurability. Don't expose fine-grained internal options.
  </check>


  <check id="DES-05" status="" summary="Law of Demeter">
        A class should know only its direct dependencies. No train-wreck chains.
  </check>


  <check id="DES-06" status="" summary="Colocation of related code">
        Related code should be close to each other or colocated.
  </check>


  <check id="DES-07" status="" summary="Immutability and Encapsulation">
        Make fields private by default. Provide getters/setters only when necessary.
        Favor immutable objects.
  </check>


  <check id="DES-08" status="" summary="Single Responsibility Principle (SRP)">
        Each class has only one reason to change. If a class is doing too much, refactor
        it into multiple classes.
  </check>


  <check id="DES-09" status="" summary="Open/Closed Principle (OCP)">
        Design classes to be open for extension but closed for modification. Use abstract
        classes or interfaces to allow new behavior without changing existing code.
  </check>


  <check id="DES-10" status="" summary="Liskov Substitution Principle (LSP)">
        Subclasses can be substituted for their base classes without altering program
        correctness. Derived classes must not strengthen preconditions or weaken postconditions.
  </check>


  <check id="DES-11" status="" summary="Interface Segregation Principle (ISP)">
        Prefer many specific interfaces over a single general-purpose interface.
        Clients should not be forced to depend on interfaces they do not use.
  </check>


  <check id="DES-12" status="" summary="Dependency Inversion Principle (DIP)">
        Depend on abstractions, not on concretions. High-level modules should not depend
        on low-level modules; both should depend on abstractions.
  </check>


  <check id="DES-13" status="" summary="Design Patterns used judiciously">
        Apply patterns when they solve a real problem. Avoid over-engineering by applying
        patterns only when they provide clear benefits in maintainability, flexibility,
        or readability.
  </check>


  <check id="DES-14" status="" summary="Document pattern intent">
        When using a design pattern, include comments that explain WHY the pattern was
        chosen and HOW it is applied.
  </check>
</section>


<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SECTION 7: FUNCTION RULES                                                 -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<section id="function-rules" title="Function Rules" priority="critical">


  <check id="FUN-01" status="" summary="No side effects from functions">
        Avoid introducing side effects from functions.
  </check>


  <check id="FUN-02" status="" summary="Command-Query Separation">
        Functions/methods should either return something OR do something, and be named
        accordingly. Never both.
  </check>


  <check id="FUN-03" status="" summary="No flag arguments">
        Don't use flag arguments. Split method into several independent methods that can
        be called from the client without the flag.
  </check>
</section>


<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SECTION 8: CODE SMELLS                                                    -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<section id="code-smells" title="Code Smells — Detect and Remediate" priority="critical">
  <preamble>
        If ANY of these smells are detected, flag them as findings and recommend remediation.
        Based on Martin Fowler's code smells taxonomy.
  </preamble>


  <check id="SMELL-01" status="" summary="Alternative Classes with Different Interfaces">
        Two classes/functions interchangeable in purpose but not in interface must be unified.
        Look for: two classes doing similar things with no shared interface or base class.
  </check>


  <check id="SMELL-02" status="" summary="Anemic Domain Model (Data Class)">
        A class that contains only fields and getters/setters with no meaningful behavior.
        Other classes do all the work on it. The logic belongs inside the class.
  </check>


  <check id="SMELL-03" status="" summary="Combinatorial Explosion / Over-configuration">
        A library or module exposes many fine-grained, independent configuration options
        instead of a coherent, high-level interface. Many small methods/options that must
        be composed manually by every caller; no convenience entry points.
  </check>


  <check id="SMELL-04" status="" summary="Divergent Change">
        A single class/function that must be modified for unrelated reasons (e.g., database
        changes AND business rule changes). Fix: split responsibilities into separate classes.
        Look for: a class touched by multiple unrelated feature streams.
  </check>


  <check id="SMELL-05" status="" summary="Feature Envy">
        A method more interested in the data of another class than its own. It calls multiple
        getters on a foreign object to compute a value that should live in that object.
        Look for: a method that chains several calls on another object's data.
  </check>


  <check id="SMELL-06" status="" summary="Inappropriate Intimacy">
        Two classes tightly coupled to each other's internal state — accessing private fields,
        calling internal helpers, or holding circular references.
  </check>


  <check id="SMELL-07" status="" summary="Lazy Class">
        A class that exists but does too little to justify its existence — thin wrappers or
        classes whose responsibilities can be absorbed elsewhere without loss of clarity.
  </check>


  <check id="SMELL-08" status="" summary="Long Parameter List">
        A method that accepts more than three arguments. Fix: group related parameters into
        a parameter object or configuration struct.
  </check>


  <check id="SMELL-09" status="" summary="Message Chains (Train Wrecks)">
        A caller navigates a chain of objects to reach data, tightly coupling itself to the
        internal structure. A sequence of calls must happen to get to a single data item.
  </check>


  <check id="SMELL-10" status="" summary="Overuse of Dynamic Features">
        Overuse of dynamic language features (e.g., method_missing, runtime eval, dynamic
        arrow functions) that make code hard to trace, understand, and debug.
  </check>


  <check id="SMELL-11" status="" summary="Middle Man">
        A class whose primary job is to delegate all (or most) of its calls to another class,
        adding no value of its own. Fix: remove middleman and call directly, or merge classes.
  </check>


  <check id="SMELL-12" status="" summary="Parallel Inheritance Hierarchies">
        Every time a subclass is created in one hierarchy, a corresponding subclass must be
        created in another. Look for: FooA/FooB always having matching BarA/BarB counterparts.
  </check>


  <check id="SMELL-13" status="" summary="Primitive Obsession">
        Using built-in primitive types (strings, integers, booleans) to represent concepts
        that have their own rules, validation, or behavior. Look for: raw strings used for
        domain values (emails, phone numbers, money); integer flags instead of enums.
  </check>


  <check id="SMELL-14" status="" summary="Refused Bequest">
        A subclass that inherits from a parent but ignores or overrides most of the parent's
        interface. They usually throw a no-implementation error in many methods.
  </check>


  <check id="SMELL-15" status="" summary="Repeated Structural Patterns">
        The same structural pattern of code repeated across many places without abstraction
        (e.g., identical setup/teardown blocks, repeated field declaration patterns).
  </check>


  <check id="SMELL-16" status="" summary="Shotgun Surgery">
        A single logical change requires small edits scattered across many unrelated classes.
        Look for: a feature toggle or config change touching five or more files.
        Fix: consolidate the scattered logic into one location.
  </check>


  <check id="SMELL-17" status="" summary="Speculative Generality (YAGNI violation)">
        Code written for hypothetical future requirements that do not exist yet — abstract
        hooks, unused parameters, or extra layers of indirection added "just in case."
  </check>


  <check id="SMELL-18" status="" summary="Duplicated Switch/Case Chains">
        The same switch/case/if-else chain duplicated across multiple places. Adding a new
        case requires finding and updating every copy. Fix: replace with polymorphism.
  </check>


  <check id="SMELL-19" status="" summary="Temporary Field">
        An instance variable only set and meaningful under certain conditions, sitting empty
        or nil the rest of the time. This makes objects inconsistent.
  </check>


  <check id="SMELL-20" status="" summary="Rigidity">
        The software is difficult to change. A small change causes a cascade of subsequent
        changes.
  </check>


  <check id="SMELL-21" status="" summary="Fragility">
        The software breaks in many places due to a single change.
  </check>


  <check id="SMELL-22" status="" summary="Immobility">
        You cannot reuse parts of the code in other projects because of involved risks and
        high effort.
  </check>


  <check id="SMELL-23" status="" summary="Deep Nesting">
        More than 5 levels of nesting is a code smell. Nesting can occur through if conditions,
        function calls, loops, etc. Flatten with early returns, extraction, or guard clauses.
  </check>
</section>


<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SECTION 9: LOGGING AND ERROR HANDLING                                     -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<section id="logging-error-handling" title="Logging and Error Handling" priority="critical">


  <check id="LOG-01" status="" summary="Logging integrated with design patterns">
        When applying design patterns, ensure that logging and error handling are integrated
        appropriately.
  </check>


  <check id="LOG-02" status="" summary="Fail safe, loud, clear, and early">
        Errors must be visible, meaningful, and caught at the earliest possible point.
  </check>


  <check id="LOG-03" status="" summary="No silent failures">
        Avoid silent failures. Ensure errors are logged with sufficient context to facilitate
        debugging and maintenance.
  </check>


  <check id="LOG-04" status="" summary="Custom exceptions where appropriate">
        Use custom exceptions to provide more meaningful error messages and to allow for more
        granular error handling in client code.
  </check>


  <check id="LOG-05" status="" summary="Exception blocks for expected errors only">
        Use exception blocks judiciously — handle expected error conditions, not control
        normal program flow.
  </check>


  <check id="LOG-06" status="" summary="Logging framework with proper levels">
        Use logging frameworks to manage log levels and outputs. Control logging behavior
        differently across environments (development vs. production).
  </check>


  <check id="LOG-07" status="" summary="Correct log levels used consistently">
        Use info, debug, warning, error, and critical log levels appropriately in every
        class and function. Consider implementing a centralized error handling mechanism
        (e.g., global exception handler) for consistent error responses.
  </check>
</section>


<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SECTION 10: OWASP SECURITY                                                -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<section id="security-owasp" title="Security — OWASP Top 10: 2025" priority="critical" enforcement="mandatory">
  <preamble>
        The AI agent MUST align all decisions with the OWASP Top 10:2025.
        Reference: https://owasp.org/Top10/2025/
        ENFORCEMENT: If code violates ANY rule in this section, the agent MUST refuse,
        rewrite, or securely redesign the solution.


        OWASP Top 10:2025 Categories:
        A01: Broken Access Control
        A02: Security Misconfiguration
        A03: Software Supply Chain Failures
        A04: Cryptographic Failures
        A05: Injection
        A06: Insecure Design
        A07: Authentication Failures
        A08: Software or Data Integrity Failures
        A09: Security Logging and Alerting Failures
        A10: Mishandling of Exceptional Conditions
  </preamble>


  <!-- ── Input Validation & Injection ── -->
  <group id="input-validation" title="Input Validation and Injection">
        <check id="SEC-01" status="" summary="CWE-20: Improper Input Validation" owasp="A05">
          All external input must be validated against strict allowlists. Use validation
          libraries (zod, pydantic, etc.).
          <example lang="python">assert username.isalnum()</example>
        </check>


        <check id="SEC-02" status="" summary="CWE-74: Injection" owasp="A05">
          Never concatenate untrusted input into commands or queries.
          <example lang="sql">SELECT * FROM users WHERE id = ?</example>
        </check>


        <check id="SEC-03" status="" summary="CWE-78: OS Command Injection" owasp="A05">
          Do not pass user input directly to system commands.
          <example lang="python">subprocess.run(["ls", safe_path])</example>
        </check>


        <check id="SEC-04" status="" summary="CWE-79: Cross-Site Scripting (XSS)" owasp="A05">
          Escape output before rendering in browsers.
        </check>


        <check id="SEC-05" status="" summary="CWE-89: SQL Injection" owasp="A05">
          Use parameterized queries only.
          <example lang="sql">db.execute("SELECT * FROM t WHERE id=?", [id])</example>
        </check>


        <check id="SEC-06" status="" summary="CWE-90: LDAP Injection" owasp="A05">
          Escape LDAP filters and use safe APIs.
          <example lang="java">filter = LdapEncoder.filterEncode(input);</example>
        </check>


        <check id="SEC-07" status="" summary="CWE-94: Code Injection" owasp="A05">
          Never execute dynamically generated code from input.
          <example lang="python"># FORBIDDEN: eval(user_input)</example>
        </check>


        <check id="SEC-08" status="" summary="CWE-95: Eval Injection" owasp="A05">
          Avoid eval, exec, or equivalents entirely.
        </check>
  </group>


  <!-- ── Authentication & Authorization ── -->
  <group id="auth" title="Authentication and Authorization">
        <check id="SEC-09" status="" summary="CWE-287: Improper Authentication" owasp="A07">
          Authentication must be explicit and centralized.
        </check>


        <check id="SEC-10" status="" summary="CWE-285: Improper Authorization" owasp="A01">
          Check authorization on every protected action.
          <example lang="python">
            if not user.can("delete"):
                deny()
          </example>
        </check>


        <check id="SEC-11" status="" summary="CWE-639: Authorization Bypass (IDOR)" owasp="A01">
          Do not trust user-supplied identifiers.
        </check>


        <check id="SEC-12" status="" summary="CWE-306: Missing Authentication" owasp="A07">
          All sensitive endpoints require authentication.
        </check>


        <check id="SEC-13" status="" summary="CWE-862: Missing Authorization" owasp="A01">
          Never assume authentication implies authorization.
        </check>


        <check id="SEC-14" status="" summary="CWE-269: Improper Privilege Management" owasp="A01">
          Use least privilege everywhere. Zero trust is mandatory.
        </check>
  </group>


  <!-- ── File, Path & Resource Handling ── -->
  <group id="file-handling" title="File, Path, and Resource Handling">
        <check id="SEC-15" status="" summary="CWE-22: Path Traversal" owasp="A01">
          Canonicalize and restrict file paths.
          <example lang="python">path = os.path.realpath(path)</example>
        </check>


        <check id="SEC-16" status="" summary="CWE-36: Absolute Path Traversal" owasp="A01">
          Reject absolute paths from user input.
        </check>


        <check id="SEC-17" status="" summary="CWE-73: External Control of File Name" owasp="A01">
          Generate server-side filenames. Never use user-supplied filenames directly.
        </check>


        <check id="SEC-18" status="" summary="CWE-434: Unrestricted File Upload" owasp="A01">
          Always validate file type, size, and content.
        </check>
  </group>


  <!-- ── Cryptography & Secrets ── -->
  <group id="crypto-secrets" title="Cryptography and Secrets">
        <check id="SEC-19" status="" summary="CWE-321: Hard-coded Crypto Keys" owasp="A04">
          Keys must never be hard-coded.
        </check>


        <check id="SEC-20" status="" summary="CWE-522: Insufficient Credential Protection" owasp="A04">
          Store passwords using strong hashing (bcrypt / argon2).
        </check>


        <check id="SEC-21" status="" summary="CWE-798: Hard-coded Credentials" owasp="A04">
          Credentials must come from secure storage (env vars, vaults, etc.).
        </check>


        <check id="SEC-22" status="" summary="CWE-759: Unsalted Hash" owasp="A04">
          Always salt and hash passwords.
        </check>
  </group>


  <!-- ── Logic, Design & Trust Boundaries ── -->
  <group id="trust-boundaries" title="Logic, Design, and Trust Boundaries">
        <check id="SEC-23" status="" summary="CWE-362: Race Condition" owasp="A06">
          Protect shared resources with synchronization.
        </check>


        <check id="SEC-24" status="" summary="CWE-367: TOCTOU" owasp="A06">
          Check and use resources atomically.
        </check>


        <check id="SEC-25" status="" summary="CWE-807: Untrusted Decisions" owasp="A06">
          Never trust client-side security decisions.
        </check>


        <check id="SEC-26" status="" summary="CWE-284: Improper Access Control" owasp="A01">
          Validate access at every layer.
        </check>
  </group>


  <!-- ── Session & Web Security ── -->
  <group id="session-web" title="Session and Web Security">
        <check id="SEC-27" status="" summary="CWE-613: Session Expiration" owasp="A07">
          Expire sessions on logout or timeout.
        </check>


        <check id="SEC-28" status="" summary="CWE-384: Session Fixation" owasp="A07">
          Rotate session IDs after login.
        </check>


        <check id="SEC-29" status="" summary="CWE-352: CSRF" owasp="A01">
          Use CSRF tokens for state-changing requests.
        </check>
  </group>


  <!-- ── Availability & Resource Management ── -->
  <group id="availability" title="Availability and Resource Management">
        <check id="SEC-30" status="" summary="CWE-400: Resource Exhaustion" owasp="A06">
          Apply limits and throttling.
        </check>


        <check id="SEC-31" status="" summary="CWE-770: Unlimited Resource Allocation" owasp="A06">
          Always cap resources per user.
        </check>


        <check id="SEC-32" status="" summary="CWE-307: Excessive Authentication Attempts" owasp="A07">
          Rate-limit login attempts.
        </check>
  </group>


  <!-- ── Error Handling & Information Exposure ── -->
  <group id="error-exposure" title="Error Handling and Information Exposure">
        <check id="SEC-33" status="" summary="CWE-209: Error Message Exposure" owasp="A10">
          Do not reveal internal details in errors.
        </check>


        <check id="SEC-34" status="" summary="CWE-200: Sensitive Data Exposure" owasp="A04">
          Classify and protect sensitive data.
        </check>


        <check id="SEC-35" status="" summary="CWE-532: Log File Exposure" owasp="A09">
          Never log secrets or credentials.
        </check>
  </group>


  <!-- ── Deserialization & Type Safety ── -->
  <group id="deserialization" title="Deserialization and Type Safety">
        <check id="SEC-36" status="" summary="CWE-502: Unsafe Deserialization" owasp="A08">
          Reject untrusted serialized objects.
        </check>


        <check id="SEC-37" status="" summary="CWE-843: Type Confusion" owasp="A08">
          Validate object types strictly.
        </check>
  </group>


  <!-- ── Configuration & Integrity ── -->
  <group id="config-integrity" title="Configuration and Integrity">
        <check id="SEC-38" status="" summary="CWE-16: Configuration Issues" owasp="A02">
          Use secure defaults only.
        </check>


        <check id="SEC-39" status="" summary="CWE-353: Missing Integrity Support" owasp="A08">
          Always validate checksums.
        </check>
  </group>
</section>




<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- ENFORCEMENT                                                               -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<enforcement>
  If code violates ANY check above, the AI agent MUST:
  1. Flag the violation with the check ID and summary.
  2. Refuse to approve the code.
  3. Rewrite or securely redesign the offending section.
  4. Re-verify the fix against the same check before marking it "pass".


  A review is COMPLETE only when every applicable check has status="pass" or status="n/a".
  No check may remain with status="" at the end of the review.
</enforcement>


</checklist>





