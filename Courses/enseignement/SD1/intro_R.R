####################################################################################################################
#####################  					INTRODUCTION   � R							#####################
####################################################################################################################





####################################################################################################################
#####################  					L'AIDE DE R  								#####################
####################################################################################################################

# R�gle num�ro un connaitre comment on se sert de l'aide ! et quelques rudiments d'anglais.
(mean, median, normal, standard deviation, matrix, vector ...)

help.search("normality")
help.search("Normality")
?randn
?rnorm 

#l'aide g�n�rale (n�cessite un navigateur web, lance un fichier HTML)
help.start()


# Notons que chaque descriptif de l'aide est suivi d'exemples souvent plus clair pour les non 
# anglophones que la notice elle m�me. Les exemples sont directement ex�cutables R

 example(mean)
# cet exemple montre qu'il y a d�j� des donn�es charg�es sous R comme USArrests qu'on reverra plus
# tard
USArrests
USArrests

#pour info en france le taux d'homicide pour 100 000 hab est de 0.7  et  6.2 pour les USA en 2000


# REM: le symbole R sert a mettre des commantaires dans le  code et tout ce qui suit n'est interpr�t�



####################################################################################################################
#####################  					LES SCRIPTES : fichier.R						#####################
####################################################################################################################

# Sous Windows: menu Fichier, s�lectionnez l'entr�e Nouveau script

#taper les commandes dans l'�diteur de texte puis pour faire interpr�ter par R cliquer sur 
# �diton, et choisissez Ex�cuter la ligne ou s�lection, ou bien Ex�cuter Tout. 

#On peut aussi ouvrir se fichier avec R: Fichier, ouvrir, puis trouver l'emplacement du  fichier intro_R.R  ... 

#Conseil: tout �crire dans des scriptes et les sauvegarder � un endroit o� l'on peut les retrouv� d'une s�ance de TP
#� l'autre.

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

# acc�der aux  lois de probabilit� usuelles, syntaxe standarde pour toute les lois r+noms, d+noms etc...
x <- dnorm(50) # valeur de la densit� de la loi normale au point 50
x <- qnorm(50) # valeur de la fonction quantile en 50 ...attention bien sur il faut appliquer �a entre 0 et 1...

#voila donc la premi�re occurence de NaN

x <- qnorm(1)   # cet fois on d�coulengthvre que Inf repr�sente l'infini en R.
x <- qnorm(0.5) # la on pouvait s'y attendre
x <- qnorm(0.975) # une classique
x <- qnorm(0.95)  # un deuxiem classique souvent arrondis a 1,96 voir 2...

x <- pnorm(50)  #valeur de la fonction  de r�partition d'une loi gaussienne en 50  
x <- rnorm(50)  #tire un vecteur de 50 valeur selon une loi normale centr�e r�duite

y <- rt(50,df=3) # loi de Student etc...

####################################################################################################################
#####################  				GRAPHIQUE  USUELS			   					#####################
####################################################################################################################



y <- rnorm(50)
plot(x,y) #affiche avec des points de mani�re standard
plot(x,y,"l") # affiche en trait continus
plot(x,y,xlab="variable x",ylab="variable y",main="mon graphe")
lines(x,x)
x <- rnorm(25,3,2)
x <- rnorm(25,sd=2, mean=0)


# graphique des quantiles empiriques contre les quantiles d'une loi normale centr�e r�duite. Si l'on est align� avec la 
# bissectrice on suit une loi normale centr�e r�duite donc
qqnorm(y)



# les histogrammes:
hist(x)

#histogrammes liss�s ou m�thodes � noyaux.
plot(density(x))


#boite � moustaches
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

#op�rations pour avoir acc�s aux lignes, colonnes, en enlever  etc...
y[1];z[1];z[-1,];z[,-2]
y[2:10]
y[-1]
y[-5:-1]

#la transposition , produit matriciel.
t(z);z%*%t(z)

#fonctions usuelles que l'on peut appliquer sur tous les �lements de la matrice
abs(z);cos(z);sin(z);tanh(z); log(z);

# cr�er des s�quences r�guli�rement espac�es
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



#Donn�es d�j� pr�sentes de bases sous R:
help(faithful)


# dataframe (tableau de donn�es en fran�ais): m�lange de texte/valeur num�riques
donnes_geyser<-faithful


#r�sum� d'un dataframe:
str(faithful)


#noms des donn�es, tailles
names(faithful); nrow(faithful);ncol(faithful);dim(faithful)


# Editer des donn�es comme sous Excel, en moins pratique.
edit(donnes_geyser)


 #obtenir quelques infos comme la m�diane les quartiles le min etc....
summary(faithful)

#on fera attention aux d�finitions nombreuses (9) pour la fonction quantile:
help(quantile)

#acc�der � une variable d'un dataframe
hist(faithful$eruptions)


#permet que R connaisse maintent chaque colonne du dataframe comme une variable
attach(faithful)
plot(eruptions,waiting)
x <-rnorm(100)
y <- 0.2+0.3*x+0.1*rnorm(x)


#charger des librairies pour avoir plus de donn�es:
library(datasets)
help(ChickWeight)
attach(ChickWeight)




####################################################################################################################
#####################  				CHARGER  DES DONNEES EXTERNES A R					#####################
####################################################################################################################

#attention par d�faut R travail dans un r�pertoir courant qui est souvent bien cach� et d�pend du
#syst�me d'exploitation

#trouver le dossier courant :
getwd() #get working directory

#Si on veut modifier le r�pertoire de travail, on utilise setwd en lui indiquant le chemin complet. Par
#sous Linux :
setwd("/home/noms/projets/R/blabla")
rgrs

#Sous Windows le chemin du r�pertoire est souvent un peu plus compliqu�. Vous pouvez alors utiliser
#la fonction selectwd de l'extension rgrs en tapant simplement :

selectwd()

#mais le plus simple est plutot de passer par les menus et de chercher dans Fichier comment mettre ou vous voulez le dossier du travail courant

#l'importation dans R ce fais alors si fichier.txt est situ� dans le r�pertoire courant et les s�parations entre les donn�es sont faites
#avec le caract�re TAB. Par exemple t�l�charger et placer dans le dossier courant le fichier :   semmelweis.txt 


donnees <- read.table("semmelweis.txt")

# Si l'on dispose d'un fichier.csv, les s�parations sont avec des points virgules , et les donn�es seront charg�es avec les conventions fran�aises.
# Par exemple t�l�charger et placer dans le dossier courant le fichier :  disponible � semmelweis.csv 

donnees_fr <- read.csv2("semmelweis.csv") #convention fran�aises



