# Partie 1
# 1.1

cobaye<-c(33,13,15,3)
mendel<-c(9/16, 3/16,3/16,1/16)
chisq.test(x=cobaye,p=mendel)

#Le résultat est le suivant :

#Chi-squared test for given probabilities

#data:  cobaye
#X-squared = 1.3333, df = 3, p-value = 0.7212

#Warning message:
#  In chisq.test(x = cobaye, p = mendel) :
#  l'approximation du Chi-2 est peut-être incorrecte

# La statitisque de test est égale à 1.3333. 
# Sous H0: "la distribution du pelage suit la loi de Mendel", 
# la loi de la statistique de test "X-squared" ~ chi2 à 3 degré de liberté (nombre de classes -1)
# la p-value est égale à 0.7212 : c'est la probabilité de rejeter à tort H0.
# On ne peut donc pas rejeter H0 et on valide donc la loi de Mendel.

# Il y a un "Warning message" : ce n'est pas une erreur.
# Cela indique que l'approximation de la loi de la statistique de test 
# par une loi du chi2 est peut-être invalide car l'une des classe contient moins de 5 individus. 
# les conditions d'utilisation du test du chi2 sont n>=30 et nbre ind. par classes >=5.


#1.2
echantillon.sim <- rnorm(50)
bornes <- c(-Inf, -2, -1, 0, 1, 2, Inf)
echantillon.regroupe <- cut(echantillon.sim, breaks=bornes)

effectifs.classes <- table(echantillon.regroupe)
# Faire remarquer aux étudiants que table(echantillon.sim) ne permet pas de regrouper l'échantillon en classes
# Vous pouvez aussi leur faire trier l'échantillon initial et "visualiser" les classes 
# sort(echantillon.sim)

# Faire un schéma des aires sous la densité correspondant aux probas des classes 
p1=pnorm(bornes[2])
p2=pnorm(bornes[3])-pnorm(bornes[2])
p3=pnorm(bornes[4])-pnorm(bornes[3])
p4=pnorm(bornes[5])-pnorm(bornes[4])
p5=pnorm(bornes[6])-pnorm(bornes[5])
p6=1-pnorm(bornes[6])

# Faire remarquer que la fonction diff fait le même calcul
diff(pnorm(bornes))
sum(diff(pnorm(bornes)))
# Ce vecteur contient les probabilités attendues sous H0:"La distibution est gaussienne centrée réduite"
# des 6 classes
# Sous H0, la statistique de test X-squared suit une loi de chi2 à 6-1=5 ddl

chisq.test(x=effectifs.classes, p=diff(pnorm(bornes)))
#On ne rejette pas H0, à nouveau on a deux classes qui contiennent moins de 5 individus
# solution changer le regroupement en classes.

# On recommence

echantillon.sim <- rnorm(1000)
bornes <- c(-Inf, -1.5, -0.5, 0.5, 1.5, Inf)
echantillon.regroupe <- cut(echantillon.sim, breaks=bornes)

effectifs.classes <- table(echantillon.regroupe)
diff(pnorm(bornes))
chisq.test(x=effectifs.classes, p=diff(pnorm(bornes)))
# On ne voir plus apparaître de "warning message"
# Les conditions de validité d'approximation par la loi du chi2 sont respectées

# 1.3
shapiro.test(echantillon.sim)

# Le test de shapiro permet de tester la normalité de l'échantillon
# aucun regroupement en classes n'est nécessaire.
# La loi de la statistique de test sous H0: "la distribution de l'échantillon est gaussienne"
# est "tabulée" et on a directement la p-value.

# Partie II : Tests d'adéquation à une loi

hcmv<-read.table("hcmv.data",head=TRUE)


segments <- seq(from=1, to=232001, by=4000)
comptage.palin <- table(cut(hcmv$location, breaks=segments, labels=FALSE))

# Il y a 296 palindromes répartis dans 58 régions
# soit en moyenne 296/58 palindromes dans chaque région
# Donc :

lambda.hat=296/58 # environ 5.10


classes <- c(-Inf, 2, 3, 4, 5, 6, 7, 8, Inf)
effectifs.observes <- table(cut(comptage.palin,breaks=classes))

# une autre façon d'estimer lambda :
# Faire la moyenne du nombre de palindromes observés dans chaque classe
(1*7+3*8+4*10+5*9+6*8+7*5+8*4+6*11)/58 # environ 5.12 



# calcul du nombre attendus de régions comptant 3 palindromes : P(X=3)*58
dpois(3,lambda.hat)*58
# ou bien de façon équivalente
58*exp(-lambda.hat)*(lambda.hat)^3/factorial(3)

# Calcul des effectifs attendus sous H0: X suit une loi de Poisson avec lambda estimé par lambda.hat
prob.theo=diff(ppois(classes, lambda.hat))

chisq.test(effectifs.observes, p = prob.theo)
# On remarque que le ddl (df=7) correspond à nombre de classes -1=8-1
# Mais ici on perd un ddl supplémentaire car on a remplacé lambda par son estimateur lambda.hat
# Sous H0, la statistique de test X-square suit une loi de xhi 2 à 6 ddl
# On ne peut interpréter la p-value.

# Corriger la p-value : comment faire?
# On doit calculer la p-value "à la main" 
test_chi2 <- chisq.test(effectifs.observes, p = prob.theo)
test_chi2$stat

p.value=1-pchisq(test_chi2$stat,6)
# On ne rejette pas H0 car la p-value vaut 0.985
# On remarque que 1-pchisq(test_chi2$stat,7) redonne bien la p-value 0.9947

# Corriger le warning message : comment faire?
# Il faut faire un autre choix de regroupement en classes pour éviter 
# d'avoir moins de 5 observations par classe
classes <- c(-Inf, 2, 3, 4, 5, 6, 7, Inf)
effectifs.observes <- table(cut(comptage.palin,breaks=classes))
prob.theo <- diff(ppois(classes, lambda.hat))
test_chi2 <- chisq.test(effectifs.observes, p = prob.theo)
p.value <- 1-pchisq(test_chi2$stat,6)

# Partie III
babies<-read.table("babies23.data",head=TRUE)
tab.ed.smoke<-table(babies$ed, babies$smoke)
chisq.test(tab.ed.smoke)
# Lorsque l'approximation de la loi sous H0 n'est pas valide
# on peut approcher la p-value "empiriquement" par Monte-Carlo
# On tire aléatoirement B=2000 (valeur par défaut) échantillons des variables X et Y
# sous l'hypothèse d'indépendance et on calcule les B stat. du chi2_b pour b=1, ..., B
# la p-value est approchée par la proportion d'échantillons tels que chi2_b>chi2_obs
# Plus le nombre d'échantillons B tirés est grand, plus la loi dite "bootstrap" est proche 
# de la loi de la statistique du chi2 (sous H0)

chisq.test(tab.ed.smoke,simulate.p.value=TRUE)
chisq.test(tab.ed.smoke,simulate.p.value=TRUE, B=200000)
