import math
import pickle
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick
import numpy as np
import pandas as pd
import matplotlib.font_manager as fm
from matplotlib.font_manager import FontProperties

# ----- Setup -----
fm.fontManager.addfont("Nunito-Bold.ttf")  # Adjust path
plt.rcParams.update(
    {
        "axes.labelsize": 30,
        "axes.titlesize": 30,
        "xtick.labelsize": 30,
        "ytick.labelsize": 30,
        "legend.fontsize": 22,
        "font.sans-serif": ["Nunito"],
    }
)
rng = np.random.default_rng(42)
font = FontProperties(family=["Nunito"], weight=700, size=30)


def lorenz_xy(counts):
    counts = np.sort(np.asarray(counts, dtype=float))
    if len(counts) == 0 or counts.sum() == 0:
        return np.array([0, 100]), np.array([0, 0])
    x = np.linspace(0, 100, len(counts) + 1)
    y = np.concatenate([[0], 100 * np.cumsum(counts) / counts.sum()])
    return x, y


def gini_from_lorenz(x, y):
    """Gini coefficient = 1 - 2 * (area under the Lorenz curve).
    x, y are expected in percent (0-100), as returned by lorenz_xy.
    Uses a manual trapezoidal rule (rather than np.trapz/np.trapezoid)
    so it doesn't depend on which name your numpy version exposes.
    """
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    area = np.sum(np.diff(x) * (y[:-1] + y[1:]) / 2.0)  # in percent^2 units
    B = area / 10000.0  # fraction of the full 100x100 square
    return 1 - 2 * B


def _text_width_px(fig, s, **kwargs):
    """Render s off-canvas and measure its actual rendered pixel width
    (accounts for the real, non-monospace glyph widths of the current
    font, unlike padding by character count).
    """
    t = fig.text(0, 0, s, **kwargs)
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    width = t.get_window_extent(renderer=renderer).width
    t.remove()
    return width


def save_lorenz_svg(
    curves, title, filename, ref_line, Gini_display=True, reference_labels=None
):
    """Plot and save Lorenz curve as SVG.
    Gini_display : bool, default True
        If True, each curve's legend label is suffixed with its Gini
        coefficient, e.g. "Pl@ntNet-300K (Gini=0.85)".
    reference_labels : list[str] or None, default None
        Labels to use as the width reference for padding/alignment,
        instead of just this call's own curves. Pass the full set of
        labels used across *all* your figures (e.g. every label in the
        curves dict below) so every generated legend box ends up the
        same fixed width -- the widest label present anywhere in that
        reference set (e.g. "Pl@ntNet (SWE) - Rand") sets the box width,
        even for plots that don't include that curve. This keeps the
        legend box from jumping in width between slide fragments/builds
        that show different subsets of curves. If None, only the labels
        in this call's own curves are used (box width varies per plot).
    """
    fig, ax = plt.subplots(figsize=(12.8, 9.6))
    ax.set_xlabel("Cumulative share of labels")
    ax.set_ylabel("Cumulative share of images")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.set_xticks([0, 20, 40, 60, 80, 100])
    ax.set_yticks([0, 20, 40, 60, 80, 100])
    ax.xaxis.set_major_formatter(mtick.PercentFormatter())
    ax.yaxis.set_major_formatter(mtick.PercentFormatter())
    ax.tick_params(axis="y", which="major", pad=15)  # Push y-labels outward
    ax.tick_params(axis="x", which="major", pad=15)  # Push x-labels outward
    label_font_kwargs = dict(
        fontsize=plt.rcParams["legend.fontsize"], fontweight="bold"
    )
    if Gini_display:
        # Measure the real rendered pixel width of every reference label
        # (same font/size/weight the legend will end up using). Using a
        # fixed, call-independent reference set (rather than just this
        # plot's own curves) is what makes the legend box a consistent
        # size across different figures/fragments.
        ref_labels = (
            reference_labels
            if reference_labels is not None
            else [c["label"] for c in curves if "label" in c]
        )
        widths_px = {l: _text_width_px(fig, l, **label_font_kwargs) for l in ref_labels}
        # Make sure every label actually being plotted has a measured
        # width too, in case it's missing from reference_labels.
        for c in curves:
            lbl = c.get("label")
            if lbl and lbl not in widths_px:
                widths_px[lbl] = _text_width_px(fig, lbl, **label_font_kwargs)
        max_width_px = max(widths_px.values(), default=0)
        space_width_px = _text_width_px(fig, " ", **label_font_kwargs)
    for c in curves:
        # Build a per-call copy of the plot kwargs so we never mutate the
        # shared curve dict (the same curve is reused across several
        # figures/configs below).
        plot_kwargs = {
            k: v for k, v in c.items() if k not in ("x", "y", "bboxx", "bboxy")
        }
        label = plot_kwargs.get("label")
        if Gini_display and label:
            gini = gini_from_lorenz(c["x"], c["y"])
            # extra_px = max_width_px - widths_px[label]
            # n_spaces = math.ceil(extra_px / space_width_px) if space_width_px > 0 else 0
            # padded_label = label + (" " * n_spaces)
            # plot_kwargs["label"] = f"{padded_label}  (Gini={gini:.2f})"
            plot_kwargs["label"] = f"{label}"
        ax.plot(c["x"], c["y"], **plot_kwargs)

        plt.text(
            c["bboxx"],
            c["bboxy"],
            f"Gini={gini:.2f}",
            fontweight="bold",
            fontsize="15",
            zorder=5,
            bbox={
                "facecolor": "white",
                "ec": plot_kwargs.get("color"),
                "alpha": 1,
                "pad": 1,
                "linewidth": plot_kwargs.get("linewidth") // 2,
                "linestyle": plot_kwargs.get("linestyle"),
                "boxstyle": "round,rounding_size=0.5",
            },
        )
    # 80% reference lines (using first curve)
    if ref_line is True:
        y_80 = np.interp(80, curves[0]["x"], curves[0]["y"])
        print(y_80)
        ax.vlines(80, 0, y_80, color="black", linestyles="--", linewidth=4, zorder=-1)
        ax.hlines(y_80, 0, 80, color="black", linestyles="--", linewidth=4, zorder=-1)
        ax.scatter(80, y_80, color="black", s=250, zorder=6)

    if any("label" in c for c in curves):
        leg = ax.legend(loc="upper left", handlelength=1.5, prop=font)
        plt.setp(leg.get_lines(), linewidth=7)
        # Setting weight via legend(prop=...) silently falls back to
        # regular weight when the active font family has no separate
        # bold face registered; explicitly setting it on each Text
        # object is the reliable way to force bold regardless of font.
        for text in leg.get_texts():
            text.set_fontweight("bold")
    if title:
        ax.set_title(title, weight="bold")
    plt.tight_layout()
    plt.savefig(f"images/{filename}.svg", bbox_inches="tight")
    plt.close()


# ----- Load data -----
df = pd.read_csv("../../../blog/long-tail/tiny_plantnet300k_metadata.csv")
x_PN300K, y_PN300K = lorenz_xy(df["counts"].to_numpy())
with open(
    "/home/jsalmon/Documents/Mes_papiers/Tanguy/tanguy_phd/TeX/mlmtp_WAUM/code/dist.pkl",
    "rb",
) as f:
    counts_imagenet = np.asarray(pickle.load(f))
counts_cifar = np.full(100, 500)
x_imagenet, y_imagenet = lorenz_xy(counts_imagenet)
x_cifar, y_cifar = lorenz_xy(counts_cifar)
with open(
    "/home/jsalmon/Documents/Mes_papiers/Tanguy/tanguy_phd/TeX/mlmtp_WAUM/code/fast.pkl",
    "rb",
) as f:
    l_full_PN = pickle.load(f)
counts_sample_PN = np.bincount(l_full_PN)
# Full PN
counts_full_PN = np.asarray(counts_sample_PN[counts_sample_PN > 4])
x_full_PN, y_full_PN = lorenz_xy(counts_full_PN)
# 2% image sampling
SAMPLE_FRACTION = 0.02
n_sample = int(round(SAMPLE_FRACTION * df["counts"].sum()))
sampled_idx = rng.choice(
    len(df), size=n_sample, replace=True, p=df["counts"] / df["counts"].sum()
)
counts_sample = np.bincount(sampled_idx, minlength=len(df))
x_sample, y_sample = lorenz_xy(counts_sample[counts_sample > 0])
# ----- Define curves -----
curves = {
    "Full_PN": {
        "x": x_full_PN,
        "y": y_full_PN,
        "color": "#047C90",
        "linestyle": "-",
        "linewidth": 7,
        "alpha": 1,
        "label": "Pl@ntNet (SWE)",
        "zorder": 1,
        "bboxx": 85,
        "bboxy": 15,
    },
    "PN300K": {
        "x": x_PN300K,
        "y": y_PN300K,
        "color": "#047C90",
        "linestyle": "dashed",
        "linewidth": 7,
        "alpha": 1,
        "label": "Pl@ntNet-300K",
        "zorder": 1,
        "bboxx": 88,
        "bboxy": 25,
    },
    "Sample": {
        "x": x_sample,
        "y": y_sample,
        "color": "#047C90",
        "linestyle": "dotted",
        "linewidth": 7,
        "label": "Pl@ntNet (SWE) - Rand",
        "zorder": 3,
        "bboxx": 87,
        "bboxy": 50,
    },
    "CIFAR": {
        "x": x_cifar,
        "y": y_cifar,
        "color": "mediumpurple",
        "linestyle": "-",
        "linewidth": 7,
        "label": "CIFAR-100",
        "zorder": 2,
        "bboxx": 10,
        "bboxy": 10,
    },
    "ImageNet": {
        "x": x_imagenet,
        "y": y_imagenet,
        "color": "dodgerblue",
        "linestyle": "-",
        "linewidth": 7,
        "label": "ImageNet",
        "zorder": 2,
        "bboxx": 20,
        "bboxy": 20,
    },
}
# ----- Generate the 5 SVGs -----
configs = [
    (["Full_PN"], "lorenz_full_plantnet", "Full Pl@ntNet", True),
    (
        ["Full_PN", "CIFAR", "ImageNet"],
        "lorenz_full_plantnet_cifar_imagenet",
        "Full Pl@ntNet, CIFAR-100, ImageNet",
        False,
    ),
    (
        ["Full_PN", "CIFAR", "ImageNet", "Sample"],
        "lorenz_full_plantnet_subsamples",
        "Full Pl@ntNet, CIFAR-100, ImageNet, Sub-samples",
        False,
    ),
    (["PN300K"], "lorenz_pn300k", "Pl@ntNet-300K", False),
    (["Full_PN"], "lorenz_full_plantnet_pure", "Full Pl@ntNet", False),
    (
        ["Full_PN", "Sample"],
        "lorenz_full_plantnet_subsamples_pure",
        "Full Pl@ntNet, Sub-samples",
        False,
    ),
    (
        ["Full_PN", "Sample", "PN300K"],
        "lorenz_full_plantnet_subsamples_pn300k",
        "Full Pl@ntNet, Sub-samples, PN300K",
        False,
    ),
    (
        ["Full_PN", "Sample", "PN300K"],
        "lorenz_full_plantnet_subsamples_pn300k_pure",
        "Full Pl@ntNet, Sub-samples, PN300K",
        False,
    ),
]
for keys, fname, title, ref_line in configs:
    # Gini_display defaults to True; pass Gini_display=False to a given
    # call below if you want a specific figure without the Gini annotation.
    save_lorenz_svg([curves[k] for k in keys], "", fname, ref_line)
