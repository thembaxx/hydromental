# CAPS / NSC physics lab

Open **Physics lab** from the playground, or visit `/physics`. The lab complements the element models with two React Three Fiber experiments. It uses the existing dependencies, procedural geometry and local studio lighting.

Production-build screenshots: [phone](interactive-lab/physics-mobile.png), [320px layout](interactive-lab/physics-320.png), [angled projectile extension](interactive-lab/physics-projectile-desktop.png), and [force diagram](interactive-lab/physics-forces-desktop.png). Flight controls appear above the scene so they are visible sooner on phones; range inputs have 44px targets.

## Projectile motion

- **Vertical throw:** launch at 19.6 m/s from ground level. The projectile reaches 19.6 m after 2 s and returns after 4 s.
- **Drop from a height:** release from rest at 19.6 m; impact occurs after 2 s.
- **Vector components:** launch at 20 m/s and 45°. This is explicitly presented as an extension of the core vertical-motion examples.

Adjust initial speed, launch angle and height. Start/pause playback, reset time, advance by 0.1 s, or scrub the entire flight. The timeline reaches the exact impact time even when it is not a multiple of 0.01 s. Adjusting launch conditions resets time to avoid mixing two experiments.

The analytical model uses `g = 9.8 m/s²`, with right/up positive:

```text
uₓ = u cos θ                 uᵧ = u sin θ
x = uₓt                     y = y₀ + uᵧt − ½gt²
vₓ = uₓ                     vᵧ = uᵧ − gt
t_ground = (uᵧ + √(uᵧ² + 2gy₀)) / g
```

The model stops at ground contact. Final velocity is evaluated immediately before impact. Air resistance, spin, collisions and bouncing are omitted. At the apex, vertical velocity is zero while acceleration remains downward. Displayed values are rounded to two decimal places; calculations and scene positions retain full precision.

## Force vectors

An isolated free-body diagram shows a block's rightward and leftward applied forces, normal force and weight. All arrow lengths share a force scale. The block is on an ideal horizontal frictionless surface with no vertical acceleration:

```text
ΣFₓ = F_right − F_left       aₓ = ΣFₓ / m
ΣFᵧ = N − mg = 0            N = mg
```

The diagram represents forces rather than displacement. A zero resultant means zero acceleration; it does not require zero velocity. Negative resultant/acceleration values indicate leftward directions.

## Curriculum and access

The [Department of Basic Education CAPS Physical Sciences, Grades 10–12](https://www.education.gov.za/LinkClick.aspx?fileticket=uVcOcx728Y8%3d&tabid=570&portalid=0&mid=1558), linked from its [FET curriculum catalogue](https://www.education.gov.za/Curriculum/CurriculumAssessmentPolicyStatements(CAPS)/CAPSFET.aspx), covers vectors, force/free-body diagrams and Newton’s laws, followed by Grade 12 vertical projectile motion. The two-dimensional angled trajectory is an exploratory extension, not a claim that oblique projectile motion is part of the core NSC vertical-motion topic.

Controls, initial results, equations and assumptions are server-rendered. Standard sliders and buttons work with keyboards and touch. Reduced motion disables continuous flight playback while preserving the timeline and step controls. Camera buttons complement drag/pinch gestures. Offscreen or hidden scenes suspend GPU draws and flight progression; WebGL failure leaves the numerical model usable. Physics has no automatic audio.

The route is included in the sitemap, discovery index, offline core and staged deployment smoke checks. Unit tests verify known timings, vector signs, equilibrium, energy conservation and finite boundary values. Browser tests exercise actual rendered motion, playback/pause, keyboard controls, 320px layouts, WCAG scans, context-loss fallback and offline navigation. Android Chromium and iOS WebKit profiles cover the narrow touch workflow.
