# Testing Prompts & Scenarios

Use these scenarios to verify the application functionality.

## 1. Authentication Flow
- **Scenario**: New User Registration
  - **Action**: Go to `/auth`, click "Sign Up", enter email/password.
  - **Expected**: Redirect to Dashboard or Home, JWT stored in localStorage.
- **Scenario**: Login
  - **Action**: Go to `/auth`, enter credentials.
  - **Expected**: Successful login.

## 2. Payment Integration
- **Scenario**: Purchase One-Time Access
  - **Action**: Click "Watch Now" on a premium movie. Select "One-Time Rental".
  - **Expected**: Razorpay modal opens (or Mock success), redirect to Watch Room.
- **Scenario**: Lifetime Access
  - **Action**: Select "Lifetime Access".
  - **Expected**: Higher price charged, permanent access granted in Dashboard.

## 3. Room & Sync (Critical)
- **Scenario**: Host Sync Authority
  - **Action**: Host plays video at 00:10.
  - **Expected**: Guest video jumps to ~00:10.15 (latency buffer).
- **Scenario**: Join Mid-Movie
  - **Action**: Host is at 05:00. Guest joins.
  - **Expected**: Guest immediately seeks to 05:00 and plays.
- **Scenario**: Pause Sync
  - **Action**: Host pauses.
  - **Expected**: All participants pause.

## 4. Dashboard
- **Scenario**: View History
  - **Action**: Go to `/profile`.
  - **Expected**: See list of purchased movies and recent rooms.

## 5. Real-time Features
- **Scenario**: Chat
  - **Action**: Send "Hello".
  - **Expected**: Appears instantly for all.
- **Scenario**: Reactions
  - **Action**: Click Heart emoji.
  - **Expected**: Floating heart animation on all screens.
