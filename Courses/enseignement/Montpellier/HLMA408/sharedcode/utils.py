import os
import matplotlib.pyplot as plt
import seaborn as sns
from os import path
# from matplotlib import rc


# rc('font', **{'family': 'sans-serif',
#               'sans-serif': ['Computer Modern Roman']})
# params = {
#           # 'axes.labelsize': 12,
#           # 'font.size': 12,
#           # 'legend.fontsize': 12,
#           # 'xtick.labelsize': 10,
#           # 'ytick.labelsize': 10,
#           'text.usetex': False,
#           # 'figure.figsize': (8, 6)
#           }
# plt.rcParams.update(params)

# sns.set_context("paper", font_scale=0.01)
# sns.set_style("ticks")
# sns.set_palette("colorblind")


def my_saving_display(fig, dirname, filename, imageformat, saving=False):
    """Function for saving the images under appropriate format."""
    if saving:
        if not path.exists(dirname):
            os.mkdir(dirname)
        image_name = os.path.join(dirname, filename + imageformat)
        fig.savefig(image_name, bbox_inches='tight')
