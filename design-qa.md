# Design QA - Authentication Redesign

## Scope

- Screens: Login and Cadastro
- State: logged out, empty form
- Viewport: 390 x 844 (iPhone portrait)

## Sources

- Visual reference: `/var/folders/rv/7lwg5gs57dvb4s74dly5_1vr0000gn/T/codex-clipboard-96a61437-28a9-423d-8530-10e496b45084.png`
- Selected generated background: `/Users/will/.codex/generated_images/019edf51-253f-7861-964b-60b6cab11423/exec-4b48010d-ed76-40b2-bc6f-17bf357c9edf.png`

## Evidence

- Login implementation: `docs/qa/auth-login-option3-final.png`
- Cadastro implementation: `docs/qa/auth-cadastro-option3-final.png`
- Same-input comparison: `docs/qa/auth-login-comparison.png`

## Comparison

- The implementation preserves the reference's dark marketplace atmosphere, magenta/cyan lighting, centered Hypou identity, dark glass fields, gradient primary action, and social sign-in hierarchy.
- The layout was compressed to fit the actual 390 x 844 mobile viewport without clipping or hiding the account creation action.
- The unverified rating, trade count, and community metrics from the concept were intentionally omitted to avoid presenting invented product data.
- Login and Cadastro use the same shell and control language, keeping the authentication flow visually consistent.

## Iteration History

1. Applied the selected generated marketplace background and shared authentication shell.
2. Found white input surfaces caused by a Tailwind opacity value that was not emitted in the build.
3. Replaced the unsupported class with an explicit translucent dark color and corrected icon stacking.
4. Re-captured Login and Cadastro and compared the final Login against the source in one image.

## Result

passed
