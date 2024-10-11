
####################################################
### 1 INFERENCE SUR LA MOYENNE D'UN ECHANTILLON ####
####################################################

#########################
## 1.1 Test de Student ##
#########################

# 1) Télécharger les données du fichier michelson.txt
# et les enregistrer dans le répertoire ~/HLMA408/TP2 
setwd("~/HLMA408/TP3")

# 2) Importer les données à l'aide de la commande read.table
# et nommez la base de données michelson 
michelson <- read.table("~/HLMA408/TP3/michelson.txt",header=TRUE)

# 3) Représenter les données sous forme d'histogramme
# et commenter en particulier l'hypothèse de données gaussiennes. 
hist(michelson$speed)

# 4) En supposant que la variance théorique est connue et vaut 105,
# tester si les mesures de Michelson confirment la valeur de la vitesse
# de la lumière proposée par Cornu.
2-2*pnorm(abs(mean(michelson$speed)-990)/(105/sqrt(20)))

# 5) Sans faire l'hypothèse que la variance est connue,
# utiliser la commande t.test pour tester si les mesures de Michelson
# confirment la valeur de la vitesse de la lumière proposée par Cornu.
# Quelle est la conclusion du test ?
# Ici on compare la moyenne de notre échantillon à une moyenne théorique :
# t-test à 1 échantillon. Il faut donc lui rentrer nos data et la moyenne théorique (mu=990).
t.test(michelson$speed, mu=990)
# p-value < 0.05 -> Hypothèse nulle rejetée : l'espérance de notre échantillon
# est significativement différente de la valeur proposée par Cornu.

# 6) Donner un intervalle de confiance pour la moyenne, aux niveaux 0.95 et 0.90.
# Par défaut l'IC a déjà un niveau de 0.95 ! On a donc seulement
# à rentrer l'option conf.level pour un IC de niveau 0.90.
t.test(michelson$speed, mu=990, conf.level=0.90)

# 7) Refaire le test pour confirmer la vitesse calculée par Cornu
# en créant une variable michelson$true_speed contenant la vraie valeur des mesures.
# Cela change-t-il la conclusion ?
michelson$true_speed <- michelson$speed + 299000
t.test(michelson$true_speed, mu=299990)
# Pas de changement, la conclusion du test reste la même que précédemment.


#########################################################
### 2 COMPARAISON DE DEUX ECHANTILLONS INDEPENDANTS  ####
#########################################################

# 1) Ouvrir le fichier de données et regarder comment il est organisé. 
# 2) Importer le jeu de données avec la commande ci-dessous
brochet <- read.table("brochet2.dat",header=TRUE)
# /!\ Utiliser l'option StringsAsFactor car "deux_ans" par exemple est une chaÃ®ne de caractère.
# Sinon il ne sait pas les lire !

# 3) Re-coder la variable age à l'aide de la fonction replace
# pour avoir 2 et 3 dans la variable age à la place de "deux_ans" et "trois_ans". 
brochet$age <- as.character(brochet$age)
brochet$age <- replace(brochet$age,brochet$age=="deux_ans","2")
brochet$age <- replace(brochet$age,brochet$age=="trois_ans","3")

# 4) Calculer et commenter les statistiques résumées obtenues avec les commandes ci-dessous :
summary(brochet$conc[brochet$age == "2"])
summary(brochet$conc[brochet$age == "3"])
# Les concentrations en DDD semblent très différentes pour les deux classes d'Ã¢ge.
# Visualisation graphique ?

# 5) Afficher un graphique en "violon" de la concentration pour chacun des Ã¢ges.
library(vioplot)
# Pensez à bien installer et surtout charger le package !
vioplot(brochet$conc[brochet$age=="2"],names="2 ans",main = "Concentration en DDT")
vioplot(brochet$conc[brochet$age=="3"],names="3 ans",main = "Concentration en DDT")
vioplot(brochet$conc[brochet$age=="2"],brochet$conc[brochet$age=="3"],names=c("2 ans","3 ans"),main = "Concentration en DDT")
# Les médianes et moyennes ont l'air très différentes entre les deux échantillons.
# Les brochets de 3 ans ont en moyenne une plus grande concentration de DDT que ceux de 2 ans.


# 6) Effectuer un test de Student pour deux échantillons indépendants avec la commande t.test
# et interpréter les résultats. 
t.test(brochet$conc[brochet$age == "2"],
       brochet$conc[brochet$age == "3"], paired=FALSE)
# /!\ Ceci n'est pas un test de Student, mais un test de Welch :
# un dérivé du test de Student qui ne fait pas l'hypothèse de l'égalité
# des variances (homoscédasticité) car par défaut on a l'option "var.equal = FALSE". En TD, on utilisera néanmoins toujours
# le test de Student, car le test de Welch est très compliqué à poser à la main.

# Ce test confirme notre impression initiale : les tailles moyennes sont
# significativement différentes. En toute rigueur, on ne peut pas affirmer
# que l'une est plus grande que l'autre, car on a réalisé un test bilatéral
# (teste l'égalité ou l'inégalité) et pas un test unilatéral (teste
# l'égalité ou une relation de supériorité/infériorité).

#####################################################
## 2.1 Test d'égalité des variances : les brochets ##
#####################################################

# 7) Pour l'égalité des variances à partir des échantillons de l'exemple
# sur les brochets dans la deuxième partie (avec le jeu de données brochet2.dat),
# créer les deux échantillons avec 
conc_2ans <- brochet$conc[brochet$age == "2"]
conc_3ans <- brochet$conc[brochet$age == "3"]
# 8) Lancer le test d'égalité des variances avec var.test(ech1, ech2) et conclure.
var.test(conc_2ans,conc_3ans)
# p-value = 0.2218 > 0,05 -> On ne rejette pas H0, donc on peut considérer les deux
# variances comme égales. On peut donc sans problème réaliser un test de Student.

# 9) Reprendre le test de Student d'égalité des moyennes avec l'option var.equal=TRUE
# ou var.equal=FALSE en fonction de la conclusion sur l'égalité des variances. 
t.test(brochet$conc[brochet$age == "2"], brochet$conc[brochet$age == "3"],
       paired=FALSE, var.equal=TRUE)
# p-value = 2.283e-11 < 0,05 -> On rejette H0, donc on peut conclure que la taille moyenne
# pour les brochets de 2 ans est significativement différente de celle des brochets de 3 ans. 

#################################################################
## 2.2 Comparaison de la pollution sur Toulouse et Montpellier ##
#################################################################

# 10) Charger les données dans R dans un dataframe
# que vous nommerez pol_occ. (attention aux séparateurs !)
pol_occ<- read.csv("Mesure_journaliere_Region_Occitanie_Polluants_Principaux.csv",
                   head=T, sep=",", dec=".")
# /!\ Attention au séparateur des champs ET des décimales : 
# bien regarder à quoi ressemble le fichier en l'ouvrant avec un éditeur de texte!!!

# 11) Observer ce que donne les commandes suivantes :
unique(pol_occ$polluant) #liste les 9 polluants recensés
unique(pol_occ$nom_com)  #liste les 31 communes recensées

# 12) Compléter le script suivant pour visualiser les violons
# des divers polluants sur Montpellier et Toulouse sur la période étudiée : 
library(vioplot)
pol<- c("O3", "PM10", "NO", "NO2", "PM2.5")
pol_toulouse_montpellier <- subset(pol_occ, nom_com == c("TOULOUSE", "MONTPELLIER"))
# Extrait une sous base de pol_occ qui ne contient que le lignes 
#qui correspondent aux communes de Montpellier ou Toulouse.

pol_toulouse_montpellier$nom_com <- factor(pol_toulouse_montpellier$nom_com,exclude = NULL)
#l'option "exclude = NULL" Permet de supprimer les noms de facteurs pour lesquel 
#il n'y a pas de données dans la base : ici tous les noms de villes autre que Montpellier et Toulouse

par(mfrow=c(1,length(pol)))
# paramètres graphiques : on va tracer les différents vioplots
# sur une même ligne mais avec autant de colonnes que de polluants. 

for(i in 1:length(pol)){ # Boucle pour qui va ici de i=1 à 5 i.e. le nombre de poluants qu'on a dans "pol"
  pol_i <- subset(pol_toulouse_montpellier,pol_toulouse_montpellier$polluant == pol[i])
  # Extrait une sous base de pol_toulouse_montpellier qui ne contient que le lignes 
  #qui correspondent au poluant "i" (la iéme valeur du vecteur "pol")
  vioplot(pol_i$valeur_originale~pol_i$nom_com,main=pol[i],names = c("MTP","TLS"))
  #Trace le vioplot de la valeur de la polution "i" en fonction (utilisation de "~")
  #du nom de la commune et rajoute comme titre (main=pol[i]) la ième valeur du du vecteur "pol".
}


# 13) En utilisant une boucle for, testez l'égalité des niveaux
# des pollutions pour les cinq polluants vus précédemment.
for(i in 1:length(pol)){ # Boucle pour qui va ici de i=1 à 5 i.e. le nombre de poluants qu'on a dans "pol"
  pol_i <- subset(pol_toulouse_montpellier,pol_toulouse_montpellier$polluant == pol[i])
  # Extrait une sous base de pol_toulouse_montpellier qui ne contient que le lignes 
  #qui correspondent au poluant "i" (la iéme valeur du vecteur "pol")
  test <- t.test(pol_i$valeur_originale~pol_i$nom_com)
  # effectue un test de student (ici plus précisément un test de Welch) 
  # pour comparer la polution moyenne du poluant "i" entre les villes de Montpellier et Toulouse
  print("###########################################") #juste pour séparet les résultats
  print(pol[i]) #affiche le nom du poluant testé
  print(test$method) #affiche ne nom du test réalisé
  print(test$estimate) #affiche les moyennes de poluant à Toulouse et Montpellier
  print(c("pvalue=",test$p.value)) #afiche la p.value du test
} #on repart en haut de la boucle

###############################################
### 3 COMPARAISON D'ECHANTILLONS APPARIES  ####
###############################################

####################################################################
## 3.1 Traitement des eaux usées : différences entre deux filtres ##
####################################################################

# 14) Téléchargez les données du fichier filtre.dat.
# Ouvrez le jeu de données et regardez la manière dont il a été saisi.
# L'importer dans R et mettre en forme les données
filtre <- read.table('filtre.dat', header=T)

# 15) Créez une variable delta égale à la différence entre les deux mesures.
# Pour cela, tapez dans la fenêtre de commande :
filtre$delta <- filtre$verre - filtre$papier

# 16) Représentez la distribution de cette variable filtre$delta à l'aide d'un histogramme.
par(mfrow=c(1,1))
# a utiliser pour revenir à un seul graphique par image si vous êtes restés sur par(mfrow=c(1,length(pol)))
hist(filtre$delta)

# 17) Faire un test de Shapiro-Wilk sur cette dernière variable
# à l'aide de la fonction shapiro.test et conclure.
shapiro.test(filtre$delta) #Test de normalité des données
# p-value > 0,05 -> On ne peut pas rejeter H0, les données semblent suivre une loi normale.

# 18) Effectuez le test de Student d'égalité des moyennes pour ces deux échantillons appariés.
# Commentez.
t.test(filtre$delta)
#Ici on préfère regrouper nos deux échantillons appariés dans une variable différentielle.
# OU BIEN
t.test(filtre$verre, filtre$papier, paired=T)
#Ici le cas de base où nos deux échantillons ne sont pas rentrés dans une seul variable
# (Mais dans ce cas-là, il faut TOUJOURS vérifier que delta suit une loi normale)
# Dans les deux cas la conclusion est la même : p-value = 1.392e-09 < 0,05 on peut donc rejeter H0.
# L'efficacité des filtres papiers est  différente de l'efficacité des filtres verres.

# Si on voulait savoir si les filtres verres sont plus efficaces que les filtres papiers ?
# -> Test unilatéral
t.test(filtre$verre, filtre$papier, paired=T, alternative = "greater")
#ou
t.test(filtre$delta, alternative = "greater")
# /!\ Ici l'ordre dans lequel vous entrez le nom de vos échantillons
# a une importance : c'est filtre$verre dont on veut savoir s'il est
# plus grand que filtre$papier
t.test(filtre$papier, filtre$verre, paired=T, alternative = "less")
#donc si vous mettez dans l'autre sens il faut aussi changer l'alternative

##############################################################################
## 3.2 Comparaison de mesures de hauteur d'un arbre : avec ou sans abattage ##
##############################################################################

#19) Importer ces données dans R.
arbres <- read.table("tailles_arbres.csv",sep = ",", header = T)

#20) Créez une variable delta égale à la différence entre les 2 mesures et représentez la densité
#de cette variable. Commentez.
arbres$delta <- arbres$sur_pied - arbres$abattus
hist(arbres$delta)
shapiro.test(arbres$delta)
# Avec l'histogramme et le test de shapiro "delta" semble bien suivre une loi normale.

#21) Peut-on dire au risque α = 5% que la nouvelle technique de mesure est (en moyenne) valide
#ou biaisée ?
t.test(arbres$delta)
#ou
t.test(arbres$sur_pied,arbres$abattus,paired = T)
# p-value = 0.007954 < 0.05 donc on rejette H0, 
# donc "difference in means is not equal to 0"  
# donc cette nouvelle méthode est biaisée.
