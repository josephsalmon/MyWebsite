# -*- coding: utf-8 -*-

# Author: Slim Essid, Joseph Salmon

import pylab as plt
import numpy as np
import wave
from sklearn import decomposition

# -- Read audio data ----------------------------------------------------------


def wavread(filename):
    wf = wave.open(filename)
    s = np.fromstring(wf.readframes(wf.getnframes()), dtype=np.int16)
    wf.close()
    return s


def wavwrite(filename, s, nchannels=1):
    wf = wave.open(filename, 'wb')
    wf.setnchannels(nchannels)
    wf.setsampwidth(2)
    wf.setframerate(32000)
    s = s / max(abs(s)) * 2 ** 14  # normalise arbitrarily
    wf.writeframes(s.astype(np.int16).tostring())
    wf.close()
s1 = wavread('./snd/es02.wav')
s2 = wavread('./snd/si01.wav')

# -- Create stereo mix --------------------------------------------------------

nsmp = min(len(s1), len(s2))
s1 = s1[:nsmp]
s2 = s2[:nsmp]
S = np.c_[s1, s2]
# Mixing matrix
A = np.array([[0.6, 0.5],
             [0.4, 0.5]])
# Do the mix
X = S.dot(A)

# Write mix file
x = np.zeros(2 * nsmp)
x[::2] = X[:, 0]
x[1::2] = X[:, 1]
wavwrite('./snd/mix.wav', x, nchannels=2)

# -- ICA source separation ----------------------------------------------------

ica = decomposition.FastICA(n_components=2, whiten=True, tol=1e-6,
                            max_iter=10)

S_ = ica.fit_transform(X)

# Visualise sources
fig1 = plt.figure(figsize=(8, 6))
plt.plot(np.arange(nsmp), S[:, 0], label="ori_sound1")
plt.plot(np.arange(nsmp), S[:, 1], label="ori_sound2")
plt.legend()
plt.show()

fig1 = plt.figure(figsize=(8, 6))
plt.plot(np.arange(nsmp), S_[:, 0], label="reconst_sound1")
plt.plot(np.arange(nsmp), S_[:, 1], label="reconst_sound2")
plt.legend()
plt.show()

# Write audio sources
wavwrite('./snd/s1.wav', S_[:, 0])
wavwrite('./snd/s2.wav', S_[:, 1])
