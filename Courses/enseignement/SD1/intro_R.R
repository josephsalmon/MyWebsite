####################################################################################################################
#####################  					INTRODUCTION   à R							#####################
####################################################################################################################





####################################################################################################################
#####################  					L'AIDE DE R  								#####################
####################################################################################################################

# Régle numéro un connaitre comment on se sert de l'aide ! et quelques rudiments d'anglais.
(mean, median, normal, standard deviation, matrix, vector ...)

help.search("normality")
help.search("Normality")
?randn
?rnorm 

#l'aide générale (nécessite un navigateur web, lance un fichier HTML)
help.start()


# Notons que chaque descriptif de l'aide est suivi d'exemples souvent plus clair pour les non 
# anglophones que la notice elle même. Les exemples sont directement exécutables R

 example(mean)
# cet exemple montre qu'il y a déjà des données chargées sous R comme USArrests qu'on reverra plus
# tard
USArrests
USArrests

#pour info en france le taux d'homicide pour 100 000 hab est de 0.7  et  6.2 pour les USA en 2000


# REM: le symbole R sert a mettre des commantaires dans le  code et tout ce qui suit n'est interprété



####################################################################################################################
#####################  					LES SCRIPTES : fichier.R						#####################
####################################################################################################################

# Sous Windows: menu Fichier, sélectionnez l'entrée Nouveau script

#taper les commandes dans l'éditeur de texte puis pour faire interpréter par R cliquer sur 
# Éditon, et choisissez Exécuter la ligne ou sélection, ou bien Exécuter Tout. 

#On peut aussi ouvrir se fichier avec R: Fichier, ouvrir, puis trouver l'emplacement du  fichier intro_R.R  ... 

#Conseil: tout écrire dans des scriptes et les sauvegarder à un endroit où l'on peut les retrouvé d'une séance de TP
#à l'autre.

# L'extension des fichier lisibles par le logiciel R est .R, par exemple:  mon_scripte1.R


####################################################################################################################
#####################  		COMMANDES USUELLES SUR LES NOMBRES ET VECTEURS				#####################
####################################################################################################################

2+3
# affectation de variable 
x <- 2
# calcul
2+x
2^x

# les vecteurs:
x <- c(-2.7,3,12,-23,5.484,11)
mean(x);sd(x);length(x)
#REM: length = taille en anglais...

#les booleens avec TRUE et FALSE
class(c(TRUE, TRUE, FALSE))


#trier un vecteur
y <- sort(x)

summary(x)

####################################################################################################################
#####################  				LOI DE PROBABILITES USUELLES						#####################
####################################################################################################################

# accéder aux  lois de probabilité usuelles, syntaxe standarde pour toute les lois r+noms, d+noms etc...
x <- dnorm(50) # valeur de la densité de la loi normale au point 50
x <- qnorm(50) # valeur de la fonction quantile en 50 ...attention bien sur il faut appliquer ça entre 0 et 1...

#voila donc la première occurence de NaN

x <- qnorm(1)   # cet fois on découlengthvre que Inf représente l'infini en R.
x <- qnorm(0.5) # la on pouvait s'y attendre
x <- qnorm(0.975) # une classique
x <- qnorm(0.95)  # un deuxiem classique souvent arrondis a 1,96 voir 2...

x <- pnorm(50)  #valeur de la fonction  de répartition d'une loi gaussienne en 50  
x <- rnorm(50)  #tire un vecteur de 50 valeur selon une loi normale centrée réduite

y <- rt(50,df=3) # loi de Student etc...

####################################################################################################################
#####################  				GRAPHIQUE  USUELS			   					#####################
####################################################################################################################



y <- rnorm(50)
plot(x,y) #affiche avec des points de manière standard
plot(x,y,"l") # affiche en trait continus
plot(x,y,xlab="variable x",ylab="variable y",main="mon graphe")
lines(x,x)
x <- rnorm(25,3,2)
x <- rnorm(25,sd=2, mean=0)


# graphique des quantiles empiriques contre les quantiles d'une loi normale centrée réduite. Si l'on est aligné avec la 
# bissectrice on suit une loi normale centrée réduite donc
qqnorm(y)



# les histogrammes:
hist(x)

#histogrammes lissés ou méthodes à noyaux.
plot(density(x))


#boite à moustaches
boxplot(x)

####################################################################################################################
#####################  				TRAITEMENT MATRICIEL ET VECTORIEL 					#####################
####################################################################################################################

#trier un vecteur
y <- sort(x)

#transformation en matrix
z<-array(y,c(5,5))
min(y);max(y);range(y);min(z);max(z)

# Indice du max ou du min dans le vecteur
which.min(x);which.max(y)

#opérations pour avoir accès aux lignes, colonnes, en enlever  etc...
y[1];z[1];z[-1,];z[,-2]
y[2:10]
y[-1]
y[-5:-1]

#la transposition , produit matriciel.
t(z);z%*%t(z)

#fonctions usuelles que l'on peut appliquer sur tous les élements de la matrice
abs(z);cos(z);sin(z);tanh(z); log(z);

# créer des séquences régulièrement espacées
x <- seq(-10,10,0.1)
y <- dnorm(x,sd=2)


x <- rpois(500,2.1)
y <-array(x,c(50,10))
mean(y)

#traitement en ligne ou en colonne pour une fonction quelconque avec apply

apply(y,1,mean)
apply(y,2,sd)
apply(y,c(1,2),mean)

y <-array(x,c(5,10,10))

apply(y,c(1,2),mean)
apply(y,c(1,3),mean)


####################################################################################################################
#####################  				CHARGER  DES DONNEES INTERNES A R					#####################
####################################################################################################################



#Données déjà présentes de bases sous R:
help(faithful)


# dataframe (tableau de données en français): mélange de texte/valeur numériques
donnes_geyser<-faithful


#résumé d'un dataframe:
str(faithful)


#noms des données, tailles
names(faithful); nrow(faithful);ncol(faithful);dim(faithful)


# Editer des données comme sous Excel, en moins pratique.
edit(donnes_geyser)


 #obtenir quelques infos comme la médiane les quartiles le min etc....
summary(faithful)

#on fera attention aux définitions nombreuses (9) pour la fonction quantile:
help(quantile)

#accéder à une variable d'un dataframe
hist(faithful$eruptions)


#permet que R connaisse maintent chaque colonne du dataframe comme une variable
attach(faithful)
plot(eruptions,waiting)
x <-rnorm(100)
y <- 0.2+0.3*x+0.1*rnorm(x)


#charger des librairies pour avoir plus de données:
library(datasets)
help(ChickWeight)
attach(ChickWeight)




####################################################################################################################
#####################  				CHARGER  DES DONNEES EXTERNES A R					#####################
####################################################################################################################

#attention par défaut R travail dans un répertoir courant qui est souvent bien caché et dépend du
#système d'exploitation

#trouver le dossier courant :
getwd() #get working directory

#Si on veut modifier le répertoire de travail, on utilise setwd en lui indiquant le chemin complet. Par
#sous Linux :
setwd("/home/noms/projets/R/blabla")
rgrs

#Sous Windows le chemin du répertoire est souvent un peu plus compliqué. Vous pouvez alors utiliser
#la fonction selectwd de l'extension rgrs en tapant simplement :

selectwd()

#mais le plus simple est plutot de passer par les menus et de chercher dans Fichier comment mettre ou vous voulez le dossier du travail courant

#l'importation dans R ce fais alors si fichier.txt est situé dans le répertoire courant et les séparations entre les données sont faites
#avec le caractère TAB. Par exemple télécharger et placer dans le dossier courant le fichier :   semmelweis.txt 


donnees <- read.table("semmelweis.txt")

# Si l'on dispose d'un fichier.csv, les séparations sont avec des points virgules , et les données seront chargées avec les conventions françaises.
# Par exemple télécharger et placer dans le dossier courant le fichier :  disponible à semmelweis.csv 

donnees_fr <- read.csv2("semmelweis.csv") #convention françaises



