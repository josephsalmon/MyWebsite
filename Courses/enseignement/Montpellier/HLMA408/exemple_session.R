#######################################
#        Un exemple de session        #
#######################################

# Chargement de la bibliothèque MASS :
library(MASS)

# Créons deux vecteurs x et y de taille 1000 en
# simulant des échantillons gaussiens independants
# de moyenne 0 et d'écart-type 1 (pour x)
# de moyenne 3 et d'écart-type 1 (pour y)
x <- rnorm(1000, mean=0, sd=1)
y <- rnorm(1000, mean=3, sd=1)

# On met bout à bout les deux échantillons avec c(x, y)
# puis on envoie ces données à la commande truehist
# avec l'option nbins=25.
# La commande truehist fait de jolis histogrammes. L'option nbins 
# permet de choisir le nombre de classes dans l'histogramme. 
truehist(c(x, y), nbins=25)

# Admirez le joli graphique dans l'onglet "Plots" de RStudio
# Utilisez la commande "Export" de cet onglet pour enregistrer 
# cet histogramme dans un fichier PDF.
# Dans directory, choisir HLMA408/TP1 de votre compte
# Dans file name, taper histogramme1.pdf

# La commande ci-dessous vous affiche la page d'aide
# de la commande truehist
?truehist

# Les deux commandes ci-dessous permettent d'afficher 
# la distribution bivariée du couple (x, y).
# Sous forme de lignes de niveaux :
contour(dd <- kde2d(x,y))
# Sous forme de régions colorées (claires = beaucoup de données)
image(dd)


#############################################################

# Créons un nouveau vecteur x. On met dans le vecteur
# x tous les nombres (à virgule) de 1 à 20 en faisant
# des saut de 0.5
x <- seq(from=1, to=20, by=0.5)
# Affichons x
x
# Créons des vecteurs w et y à partir de ce vecteur x.
w <- 1 + x/2
y <- x + w*rnorm(x)

# Rangeons les trois vecteurs x, y et w dans une table
# de données (data.frame). Chaque vecteur occupe une
# colonne
dum <-  data.frame(x, y, w)
# Affichons cette table qui s'appelle dum :
dum
# Effaçons (rm = remove) les vecteurs x, y et z qui sont
# maintenant stockés dans dum.
rm(x, y, w)
# Cliquer sur dum dans l'onglet "Workspace". Que se passe t-il ?


# Faisons maintenant un peu de régression linéaire sur
# cette table de données.

# La commande ci-dessous demande à R de faire les calculs
# pour expliquer la variable y à l'aide de la variable x
# dans les données dum et de stocker l'ensemble des 
# résultats numériques dans un objet qui s'appelle fm
fm <- lm(y ~ x,  data=dum)

# Afficher un résumé de l'objet fm
summary(fm)
# Noter que les calculs relatifs à l'ordonnée à l'origine sont dans la
# ligne (Intercept), et la pente en facteur de x est dans la ligne x.

# Affichons le nuage de points (x,y) de la table dum
plot(dum$x, dum$y)
# Ajoutons sur ce graphique une droite 
# d'ordonnée à l'origine 0, de pente 1
# en pointillés légérs (lty = line type, 3 = pointillés légers)
# et en vert (col = color, 3 = vert)
abline(0, 1, lty = 3, col = 3)

# Ajoutons sur ce graphique une droite
# construite avec les résultats de la régression linéaire
# stocké dans fm, de couleur bleue (codée 4), 
# en trait plein (pas d'option lty)
abline(fm, col = 4)

plot(fitted(fm), resid(fm), xlab = "Fitted Values", ylab = "Residuals")

# Effaçons fm et dum de la mémoire de R qui ne nous servirons plus
# par la suite :
rm(fm, dum)

# Notez qu'ils n'apparaissent plus dans l'onglet "Workspace" !



#####################################################################

# Allons chercher le jeu de données hills dans les bibliothèques chargées
data(hills)
# L'afficher :
View(hills)
# Afficher la page d'aide qui présente le jeu de données
?hills

# Affichons les données sous formes de nuage de points par couples de variables.
pairs(hills)
# Affichons la variable time en fonction de la variable dist :
plot(hills$dist, hills$time, xlab="Distance (in miles)", ylab="Time (in min)")
# La commande ci-dessous permet d'identifier les points du nuage de points.
identify(hills$dist, hills$time, row.names(hills))
# Cliquer sur les cinq points les plus à droite dans le graphique
# Puis taper sur la touche "Echap." ou "ESC" 
# Constater le résultat.

# On ajoute l'estimation de la droite de régression de time en fonction de dist
abline(lm(time ~ dist, data=hills))