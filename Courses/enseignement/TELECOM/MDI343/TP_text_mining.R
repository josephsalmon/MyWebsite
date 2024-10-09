# Text mining with R


# use getwd(),setwd(dir)
setwd("/data/salmon/Mes_cours/Telecom/MDI343/tps_mdi343/text_mining/")
#positive part
posText <- read.delim(file='rt-polaritydata/rt-polarity_clean.pos', 
                      header=FALSE, stringsAsFactors=FALSE)
posText <- posText$V1

install.packages("stringr")
library("stringr")
posText <- unlist(lapply(posText, function(x) { str_split(x, "\n") }))
posText[1:99]
dim(posText)
#negative part
#rt-polarity-neg
negText <- read.delim(file='rt-polaritydata/rt-polarity_clean.neg',
                      header=FALSE, stringsAsFactors=FALSE)

# negText <- read.delim(file='rt-polaritydata/rt-polarity-neg.txt',
#                       header=FALSE, stringsAsFactors=FALSE)
# 

negText <- negText$V1
negText <- unlist(lapply(negText, function(x) { str_split(x, "\n") }))



head(posText)

#load up word polarity list and format it
afinn_list <- read.delim(file='AFINN/AFINN-111.txt', 
                         header=FALSE, stringsAsFactors=FALSE)
names(afinn_list) <- c('word', 'score')
afinn_list$word <- tolower(afinn_list$word) # transform to lower case

#categorize words as very negative to very positive and add some movie-specific words
vNegTerms <- afinn_list$word[afinn_list$score==-5 | afinn_list$score==-4]
negTerms <- c(afinn_list$word[afinn_list$score==-3 | afinn_list$score==-2 | 
                                afinn_list$score==-1], 
              "second-rate", "moronic", "third-rate", "flawed", "juvenile", "boring", "distasteful", "ordinary", "disgusting", "senseless", "static", "brutal", "confused", "disappointing", "bloody", "silly", "tired", "predictable", "stupid", "uninteresting", "trite", "uneven", "outdated", "dreadful", "bland")
posTerms <- c(afinn_list$word[afinn_list$score==3 | afinn_list$score==2 | afinn_list$score==1], "first-rate", "insightful", "clever", "charming", "comical", "charismatic", "enjoyable", "absorbing", "sensitive", "intriguing", "powerful", "pleasant", "surprising", "thought-provoking", "imaginative", "unpretentious")
vPosTerms <- c(afinn_list$word[afinn_list$score==5 | afinn_list$score==4], "uproarious", "riveting", "fascinating", "dazzling", "legendary")



#load the packages plyr

#install.packages("plyr")
library("plyr")


#function to calculate number of words in each category within a sentence
sentimentScore <- function(sentences, vNegTerms, negTerms, posTerms, vPosTerms){
  final_scores <- matrix('', 0, 5)
  scores <- laply(sentences, function(sentence, vNegTerms, negTerms, posTerms, vPosTerms){
    initial_sentence <- sentence
    #remove unnecessary characters and split up by word 
    sentence <- gsub('[[:punct:]]', '', sentence)
    sentence <- gsub('[[:cntrl:]]', '', sentence)
    sentence <- gsub('\\d+', '', sentence)
    sentence <- tolower(sentence)
    wordList <- str_split(sentence, '\\s+')
    words <- unlist(wordList)
    #build vector with matches between sentence and each category
    vPosMatches <- match(words, vPosTerms)
    posMatches <- match(words, posTerms)
    vNegMatches <- match(words, vNegTerms)
    negMatches <- match(words, negTerms)
    #sum up number of words in each category
    vPosMatches <- sum(!is.na(vPosMatches))
    posMatches <- sum(!is.na(posMatches))
    vNegMatches <- sum(!is.na(vNegMatches))
    negMatches <- sum(!is.na(negMatches))
    score <- c(vNegMatches, negMatches, posMatches, vPosMatches)
    #add row to scores table
    newrow <- c(initial_sentence, score)
    final_scores <- rbind(final_scores, newrow)
    return(final_scores)
  }, vNegTerms, negTerms, posTerms, vPosTerms)
  return(scores)
}

#build tables of positive and negative sentences with scores
sentence=posText
sentence <- gsub('[[:punct:]]', '', sentence)

sentence= tolower(sentence)
sentence[1:5]

posResult <- as.data.frame(sentimentScore(posText, vNegTerms, negTerms, posTerms, vPosTerms))
negResult <- as.data.frame(sentimentScore(negText, vNegTerms, negTerms, posTerms, vPosTerms))
posResult <- cbind(posResult, 'positive')
colnames(posResult) <- c('sentence', 'vNeg', 'neg', 'pos', 'vPos', 'sentiment')
negResult <- cbind(negResult, 'negative')
colnames(negResult) <- c('sentence', 'vNeg', 'neg', 'pos', 'vPos', 'sentiment')    

#combine the positive and negative tables
results <- rbind(posResult, negResult)


library(e1071)
## Example with metric predictors:
data(iris)
m <- naiveBayes(Species ~ ., data = iris)
## alternatively:
m <- naiveBayes(iris[,-5], iris[,5])
m
table(predict(m, iris), iris[,5])


classifier <- naiveBayes(results[,2:5], results[,6])
confTable <- table(predict(classifier, results), results[,6], dnn=list('predicted','actual'))
confTable
binom.test(confTable[1,1] + confTable[2,2], nrow(results), p=0.5)




#####################################################################
install.packages("textir")
library(textir)
data(congress109)
sort(sdev(tfidf(congress109Counts)), decreasing=TRUE)[1:20]

#http://fr.wikipedia.org/wiki/TF-IDF
?tfidf

sort(sdev(tfidf(congress109Counts)), decreasing=FALSE)[1:20]



max(congress109Counts)
min(tfidf(congress109Counts))

head(congress109Ideology)
dim(congress109Counts)

congress109Ideology[c(68,388),1:7]
a=congress109Counts[388,15]
congress109Counts

#look for the structure simple_triplet_matrix.
?simple_triplet_matrix

length(congress109Counts) # number of elements or components
str(congress109Counts)    # structure of an object 
class(congress109Counts)  # class or type of an object
names(congress109Counts)  # names

newobject  <- edit(congress109Counts) # edit copy and save as newobject 
fix(congress109Counts)               # edit in place


## Bivariate sentiment factors (roll-call vote common scores)
fitCS <- mnlm(congress109Counts, congress109Ideology[,6:7], bins=5, penalty=c(4,1/2))

## plot the fit
plot(fitCS, log='xy', boxwex=.2)
## plot the inverse regression reduction
par(mfrow=c(1,2))
plot(fitCS, type="reduction", v=congress109Ideology$repshare, xlab="Republican Vote-Share",
     covar=1, pch=21, bg=c(4,3,2)[congress109Ideology$party], main="1st common score")
plot(fitCS, type="reduction", v=congress109Ideology$repshare, xlab="Republican Vote-Share", 
     covar=2, pch=21, bg=c(4,3,2)[congress109Ideology$party], main="2nd common score")

## example usage of the predict method
predict(fitCS, type="reduction", newdata=congress109Counts[c(68,388),])
predict(fitCS, type="response", newdata=congress109Ideology[c(68,388),6:7])[,c(995,997)]

## example usage of summary method
summary(fitCS, y=congress109Ideology$repshare)

## Fit topic model (use lower tol for true convergence)
par(mfrow=c(1,1))
tpx <- topics(congress109Counts, K=10, tol=100)
plot(tpx, group=congress109Ideology$party=="R", col=c(4,2), labels=c("Dem","GOP"))
summary(tpx)
