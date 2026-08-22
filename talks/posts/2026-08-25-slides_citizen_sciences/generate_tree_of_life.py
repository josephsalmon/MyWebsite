"""
Generate a symmetric tree of life with depth-based CMYK coloring.
- Leaves reduced by ~50% (removed 3-child branches)
- Perfect vertical symmetry (left/right mirror)
- Depth-based colors: CMYK(100,0,90) to (100,0,20)
"""

import math
import random

for seed in range(100):
    random.seed(seed)

    MAX_DEPTH = 8

    # --- base point (all primary roots emanate from here) ---
    BASE_X, BASE_Y = 0.0, 0.0

    # --- growth parameters ---
    BASE_LENGTH = 18
    LENGTH_SHRINK = (0.74, 0.90)
    BASE_STROKE = 2.8
    LATERAL_STROKE = 2.9
    STROKE_SHRINK = 0.9
    MIN_STROKE = 0.10

    DOWN = 0
    N_LATERAL = 2
    LATERAL_SPREAD = 90
    CHILD_ANGLE_SPREAD = 26
    ANGLE_JITTER = 9
    CURVE_BOW = 0.20
    BRANCH_PROBS = [(1, 0.6), (2, 0.3), (3, 0.05), (4, 0.05)]
    points_seen = []
    paths = []
    leaf_depths = []

    def choose_branch_factor():
        r = random.random()
        acc = 0.0
        for factor, p in BRANCH_PROBS:
            acc += p
            if r <= acc:
                return factor
        return BRANCH_PROBS[-1][0]

    def get_color_for_depth(depth):
        """CMYK(100,0,K) where K = 90,80,...,20 for depths 0-7"""
        k_percent = 90 - (depth * 10)
        k = k_percent / 100.0
        gb_value = int(255 * (1 - k))
        return f"rgb(0,{gb_value},{gb_value})"

    def add_segment(x, y, ex, ey, stroke_width, depth):
        mx, my = (x + ex) / 2, (y + ey) / 2
        seg_len = math.hypot(ex - x, ey - y)
        angle = math.atan2(ex - x, ey - y)
        perp = angle + math.pi / 2
        bow = seg_len * CURVE_BOW * random.choice([-1, 1])
        cx = mx + bow * math.sin(perp)
        cy = my + bow * math.cos(perp)
        color = get_color_for_depth(depth)
        paths.append(
            {
                "d": f"M {x:.3f},{y:.3f} Q {cx:.3f},{cy:.3f} {ex:.3f},{ey:.3f}",
                "stroke_width": round(stroke_width, 3),
                "color": color,
            }
        )
        points_seen.extend([(x, y), (cx, cy), (ex, ey)])

    def grow(x, y, angle_deg, length, depth, stroke_width):
        if depth >= MAX_DEPTH:
            leaf_depths.append(depth)
            return

        n_children = choose_branch_factor()

        if n_children == 1:
            child_angles = [angle_deg + random.uniform(-ANGLE_JITTER, ANGLE_JITTER)]
        elif n_children == 2:
            jitter = random.uniform(-ANGLE_JITTER, ANGLE_JITTER)
            spread = CHILD_ANGLE_SPREAD + random.uniform(-4, 4)
            child_angles = [
                angle_deg - spread / 2 + jitter,
                angle_deg + spread / 2 + jitter,
            ]
        else:  # n_children == 3
            jitter = random.uniform(-ANGLE_JITTER, ANGLE_JITTER)
            spread = CHILD_ANGLE_SPREAD * 1.5 + random.uniform(-4, 4)
            child_angles = [
                angle_deg - spread + jitter,
                angle_deg + jitter,
                angle_deg + spread + jitter,
            ]

        for child_angle in child_angles:
            child_length = length * random.uniform(*LENGTH_SHRINK)
            rad = math.radians(child_angle)
            ex = x + child_length * math.sin(rad)
            ey = y + child_length * math.cos(rad)
            child_stroke = max(MIN_STROKE, stroke_width * STROKE_SHRINK)
            add_segment(x, y, ex, ey, stroke_width, depth)
            grow(ex, ey, child_angle, child_length, depth + 1, child_stroke)

    # Central taproot (perfectly vertical)
    tap_angle = DOWN
    tap_length = BASE_LENGTH * 1.15
    rad = math.radians(tap_angle)
    ex = BASE_X + tap_length * math.sin(rad)
    ey = BASE_Y + tap_length * math.cos(rad)
    add_segment(BASE_X, BASE_Y, ex, ey, BASE_STROKE, 0)
    grow(ex, ey, tap_angle, tap_length, 1, BASE_STROKE)

    # Create N_LATERAL symmetric roots
    for i in range(N_LATERAL):
        # Distribute symmetrically: -1, 0, +1 for N_LATERAL=3
        side_multiplier = (i - (N_LATERAL - 1) / 2) * 2 / max(N_LATERAL - 1, 1)
        a = DOWN + side_multiplier * (LATERAL_SPREAD / 2) + random.uniform(-8, 8)
        length = BASE_LENGTH * random.uniform(0.65, 1.05)
        rad = math.radians(a)
        ex = BASE_X + length * math.sin(rad)
        ey = BASE_Y + length * math.cos(rad)
        stroke = LATERAL_STROKE * random.uniform(0.8, 1.15)
        add_segment(BASE_X, BASE_Y, ex, ey, stroke, 0)
        grow(ex, ey, a, length, 1, stroke)

    # Central taproot (perfectly vertical)
    tap_angle = DOWN
    tap_length = BASE_LENGTH * 1.15
    rad = math.radians(tap_angle)
    ex = BASE_X + tap_length * math.sin(rad)
    ey = BASE_Y + tap_length * math.cos(rad)
    add_segment(BASE_X, BASE_Y, ex, ey, BASE_STROKE, 0)
    grow(ex, ey, tap_angle, tap_length, 1, BASE_STROKE)

    # Symmetric lateral roots (1 pair)
    for side in [-1, 1]:
        a = DOWN + side * (LATERAL_SPREAD / 2) + random.uniform(-8, 8)
        length = BASE_LENGTH * random.uniform(0.65, 1.05)
        rad = math.radians(a)
        ex = BASE_X + length * math.sin(rad)
        ey = BASE_Y + length * math.cos(rad)
        stroke = LATERAL_STROKE * random.uniform(0.8, 1.15)
        add_segment(BASE_X, BASE_Y, ex, ey, stroke, 0)
        grow(ex, ey, a, length, 1, stroke)

    # Verification
    assert len(leaf_depths) > 0, "no leaves generated"
    assert all(
        d == MAX_DEPTH for d in leaf_depths
    ), f"leaf depths not uniform: {sorted(set(leaf_depths))}"
    print(f"OK: {len(leaf_depths)} leaves, all at depth {MAX_DEPTH}")
    print(f"total branch segments: {len(paths)}")

    # Compute viewBox
    xs = [p[0] for p in points_seen]
    ys = [p[1] for p in points_seen]
    margin = 4
    min_x, max_x = min(xs) - margin, max(xs) + margin
    min_y, max_y = min(ys) - margin, max(ys) + margin
    vb_w, vb_h = max_x - min_x, max_y - min_y
    print(f"viewBox: {min_x:.1f} {min_y:.1f} {vb_w:.1f} {vb_h:.1f}")

    # Write SVG
    svg_parts = [
        f'<svg width="{vb_w:.1f}mm" height="{vb_h:.1f}mm" '
        f'viewBox="{min_x:.1f} {min_y:.1f} {vb_w:.1f} {vb_h:.1f}" '
        f'version="1.1" xmlns="http://www.w3.org/2000/svg">',
        "<g>",
    ]
    for p in paths:
        svg_parts.append(
            f'<path d="{p["d"]}" style="fill:none;stroke:{p["color"]};'
            f'stroke-width:{p["stroke_width"]};stroke-linecap:round;stroke-opacity:0.92" />'
        )
    svg_parts.append("</g>")
    svg_parts.append("</svg>")

    with open(f"random_trees/root_tree_of_life_{seed}.svg", "w", encoding="utf-8") as f:
        f.write("\n".join(svg_parts))
    print("Saved root_tree_of_life.svg")
