import os

from distutils.core import setup


descr = 'Utils for the course on Robustness'

version = None
with open(os.path.join('share_code', '__init__.py'), 'r') as fid:
    for line in (line.strip() for line in fid):
        if line.startswith('__version__'):
            version = line.split('=')[1].strip().strip('\'')
            break
if version is None:
    raise RuntimeError('Could not determine version')

DISTNAME = 'share_code'
DESCRIPTION = descr
MAINTAINER = 'Joseph Salmon'
MAINTAINER_EMAIL = 'XXX'
LICENSE = 'BSD (3-clause)'
DOWNLOAD_URL = 'XXX'
VERSION = version
URL = 'XXX'

setup(name='share_code',
      version=VERSION,
      description=DESCRIPTION,
      long_description=open('README.md').read(),
      license=LICENSE,
      maintainer=MAINTAINER,
      maintainer_email=MAINTAINER_EMAIL,
      url=URL,
      download_url=DOWNLOAD_URL,
      packages=['share_code'],
      )
