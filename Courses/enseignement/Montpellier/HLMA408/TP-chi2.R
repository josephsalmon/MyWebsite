# Partie 1
# 1.1

cobaye<-c(33,13,15,3)
mendel<-c(9/16, 3/16,3/16,1/16)
chisq.test(x=cobaye,p=mendel)

#Le r�sultat est le suivant :

#Chi-squared test for given probabilities

#data:  cobaye
#X-squared = 1.3333, df = 3, p-value = 0.7212

#Warning message:
#  In chisq.test(x = cobaye, p = mendel) :
#  l'approximation du Chi-2 est peut-�tre incorrecte

# La statitisque de test est �gale � 1.3333. 
# Sous H0: "la distribution du pelage suit la loi de Mendel", 
# la loi de la statistique de test "X-squared" ~ chi2 � 3 degr� de libert� (nombre de classes -1)
# la p-value est �gale � 0.7212 : c'est la probabilit� de rejeter � tort H0.
# On ne peut donc pas rejeter H0 et on valide donc la loi de Mendel.

# Il y a un "Warning message" : ce n'est pas une erreur.
# Cela indique que l'approximation de la loi de la statistique de test 
# par une loi du chi2 est peut-�tre invalide car l'une des classe contient moins de 5 individus. 
# les conditions d'utilisation du test du chi2 sont n>=30 et nbre ind. par classes >=5.


#1.2
echantillon.sim <- rnorm(50)
bornes <- c(-Inf, -2, -1, 0, 1, 2, Inf)
echantillon.regroupe <- cut(echantillon.sim, breaks=bornes)

effectifs.classes <- table(echantillon.regroupe)
# Faire remarquer aux �tudiants que table(echantillon.sim) ne permet pas de regrouper l'�chantillon en classes
# Vous pouvez aussi leur faire trier l'�chantillon initial et "visualiser" les classes 
# sort(echantillon.sim)

# Faire un sch�ma des aires sous la densit� correspondant aux probas des classes 
p1=pnorm(bornes[2])
p2=pnorm(bornes[3])-pnorm(bornes[2])
p3=pnorm(bornes[4])-pnorm(bornes[3])
p4=pnorm(bornes[5])-pnorm(bornes[4])
p5=pnorm(bornes[6])-pnorm(bornes[5])
p6=1-pnorm(bornes[6])

# Faire remarquer que la fonction diff fait le m�me calcul
diff(pnorm(bornes))
sum(diff(pnorm(bornes)))
# Ce vecteur contient les probabilit�s attendues sous H0:"La distibution est gaussienne centr�e r�duite"
# des 6 classes
# Sous H0, la statistique de test X-squared suit une loi de chi2 � 6-1=5 ddl

chisq.test(x=effectifs.classes, p=diff(pnorm(bornes)))
#On ne rejette pas H0, � nouveau on a deux classes qui contiennent moins de 5 individus
# solution changer le regroupement en classes.

# On recommence

echantillon.sim <- rnorm(1000)
bornes <- c(-Inf, -1.5, -0.5, 0.5, 1.5, Inf)
echantillon.regroupe <- cut(echantillon.sim, breaks=bornes)

effectifs.classes <- table(echantillon.regroupe)
diff(pnorm(bornes))
chisq.test(x=effectifs.classes, p=diff(pnorm(bornes)))
# On ne voir plus appara�tre de "warning message"
# Les conditions de validit� d'approximation par la loi du chi2 sont respect�es

# 1.3
shapiro.test(echantillon.sim)

# Le test de shapiro permet de tester la normalit� de l'�chantillon
# aucun regroupement en classes n'est n�cessaire.
# La loi de la statistique de test sous H0: "la distribution de l'�chantillon est gaussienne"
# est "tabul�e" et on a directement la p-value.

# Partie II : Tests d'ad�quation � une loi

hcmv<-read.table("hcmv.data",head=TRUE)


segments <- seq(from=1, to=232001, by=4000)
comptage.palin <- table(cut(hcmv$location, breaks=segments, labels=FALSE))

# Il y a 296 palindromes r�partis dans 58 r�gions
# soit en moyenne 296/58 palindromes dans chaque r�gion
# Donc :

lambda.hat=296/58 # environ 5.10


classes <- c(-Inf, 2, 3, 4, 5, 6, 7, 8, Inf)
effectifs.observes <- table(cut(comptage.palin,breaks=classes))

# une autre fa�on d'estimer lambda :
# Faire la moyenne du nombre de palindromes observ�s dans chaque classe
(1*7+3*8+4*10+5*9+6*8+7*5+8*4+6*11)/58 # environ 5.12 



# calcul du nombre attendus de r�gions comptant 3 palindromes : P(X=3)*58
dpois(3,lambda.hat)*58
# ou bien de fa�on �quivalente
58*exp(-lambda.hat)*(lambda.hat)^3/factorial(3)

# Calcul des effectifs attendus sous H0: X suit une loi de Poisson avec lambda estim� par lambda.hat
prob.theo=diff(ppois(classes, lambda.hat))

chisq.test(effectifs.observes, p = prob.theo)
# On remarque que le ddl (df=7) correspond � nombre de classes -1=8-1
# Mais ici on perd un ddl suppl�mentaire car on a remplac� lambda par son estimateur lambda.hat
# Sous H0, la statistique de test X-square suit une loi de xhi 2 � 6 ddl
# On ne peut interpr�ter la p-value.

# Corriger la p-value : comment faire?
# On doit calculer la p-value "� la main" 
test_chi2 <- chisq.test(effectifs.observes, p = prob.theo)
test_chi2$stat

p.value=1-pchisq(test_chi2$stat,6)
# On ne rejette pas H0 car la p-value vaut 0.985
# On remarque que 1-pchisq(test_chi2$stat,7) redonne bien la p-value 0.9947

# Corriger le warning message : comment faire?
# Il faut faire un autre choix de regroupement en classes pour �viter 
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
# On tire al�atoirement B=2000 (valeur par d�faut) �chantillons des variables X et Y
# sous l'hypoth�se d'ind�pendance et on calcule les B stat. du chi2_b pour b=1, ..., B
# la p-value est approch�e par la proportion d'�chantillons tels que chi2_b>chi2_obs
# Plus le nombre d'�chantillons B tir�s est grand, plus la loi dite "bootstrap" est proche 
# de la loi de la statistique du chi2 (sous H0)

chisq.test(tab.ed.smoke,simulate.p.value=TRUE)
chisq.test(tab.ed.smoke,simulate.p.value=TRUE, B=200000)
