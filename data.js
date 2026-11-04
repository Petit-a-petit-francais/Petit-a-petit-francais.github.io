// Content for Petit à petit français: verbs, practice sentences, vocabulary, grammar sheets.
// Verb row: [infinitive, english, "présent je tu il nous vous ils" (a|b = both accepted), participe passé, aux a/e, futur stem (if irregular), imparfait stem (if irregular)]
window.DATA = {};

DATA.verbs = [
  // core verbs, most frequent first
  ["parler", "to speak", "parle parles parle parlons parlez parlent", "parlé", "a"],
  ["aimer", "to like / love", "aime aimes aime aimons aimez aiment", "aimé", "a"],
  ["adorer", "to adore", "adore adores adore adorons adorez adorent", "adoré", "a"],
  ["travailler", "to work", "travaille travailles travaille travaillons travaillez travaillent", "travaillé", "a"],
  ["habiter", "to live (somewhere)", "habite habites habite habitons habitez habitent", "habité", "a"],
  ["être", "to be", "suis es est sommes êtes sont", "été", "a", "ser", "ét"],
  ["avoir", "to have", "ai as a avons avez ont", "eu", "a", "aur"],
  ["aller", "to go", "vais vas va allons allez vont", "allé", "e", "ir"],
  ["venir", "to come", "viens viens vient venons venez viennent", "venu", "e", "viendr"],
  ["faire", "to do / make", "fais fais fait faisons faites font", "fait", "a", "fer"],
  ["écrire", "to write", "écris écris écrit écrivons écrivez écrivent", "écrit", "a"],
  ["lire", "to read", "lis lis lit lisons lisez lisent", "lu", "a"],
  ["prendre", "to take", "prends prends prend prenons prenez prennent", "pris", "a"],
  ["comprendre", "to understand", "comprends comprends comprend comprenons comprenez comprennent", "compris", "a"],
  ["apprendre", "to learn", "apprends apprends apprend apprenons apprenez apprennent", "appris", "a"],
  ["voir", "to see", "vois vois voit voyons voyez voient", "vu", "a", "verr"],
  ["partir", "to leave", "pars pars part partons partez partent", "parti", "e"],
  ["sortir", "to go out", "sors sors sort sortons sortez sortent", "sorti", "e"],
  ["connaître", "to know (a person, place)", "connais connais connaît|connait connaissons connaissez connaissent", "connu", "a", "connaîtr"],
  ["pouvoir", "can / to be able to", "peux peux peut pouvons pouvez peuvent", "pu", "a", "pourr"],
  ["vouloir", "to want", "veux veux veut voulons voulez veulent", "voulu", "a", "voudr"],
  ["devoir", "must / to have to", "dois dois doit devons devez doivent", "dû", "a", "devr"],
  ["savoir", "to know (a fact, how to)", "sais sais sait savons savez savent", "su", "a", "saur"],
  ["boire", "to drink", "bois bois boit buvons buvez boivent", "bu", "a"],
  ["mettre", "to put / put on", "mets mets met mettons mettez mettent", "mis", "a"],
  ["attendre", "to wait (for)", "attends attends attend attendons attendez attendent", "attendu", "a"],
  ["entendre", "to hear", "entends entends entend entendons entendez entendent", "entendu", "a"],
  ["vendre", "to sell", "vends vends vend vendons vendez vendent", "vendu", "a"],
  ["descendre", "to go down", "descends descends descend descendons descendez descendent", "descendu", "e"],
  ["répondre", "to answer", "réponds réponds répond répondons répondez répondent", "répondu", "a"],
  ["vivre", "to live", "vis vis vit vivons vivez vivent", "vécu", "a"],
  ["falloir", "to be necessary", "faut", "fallu", "a", "faudr", "fall"],
  ["pleuvoir", "to rain", "pleut", "plu", "a", "pleuvr", "pleuv"],
  ["croire", "to believe", "crois crois croit croyons croyez croient", "cru", "a"],
  ["penser", "to think", "pense penses pense pensons pensez pensent", "pensé", "a"],
  ["manquer", "to miss / be missing", "manque manques manque manquons manquez manquent", "manqué", "a"],
  ["plaire", "to please", "plais plais plaît|plait plaisons plaisez plaisent", "plu", "a"],
  ["se réveiller", "to wake up", "réveille réveilles réveille réveillons réveillez réveillent", "réveillé", "e"],
  ["se lever", "to get up", "lève lèves lève levons levez lèvent", "levé", "e", "lèver"],
  ["se coucher", "to go to bed", "couche couches couche couchons couchez couchent", "couché", "e"],
  ["se doucher", "to shower", "douche douches douche douchons douchez douchent", "douché", "e"],
  ["s'habiller", "to get dressed", "habille habilles habille habillons habillez habillent", "habillé", "e"],
  ["se reposer", "to rest", "repose reposes repose reposons reposez reposent", "reposé", "e"],
  ["se maquiller", "to put on make-up", "maquille maquilles maquille maquillons maquillez maquillent", "maquillé", "e"],
  ["se raser", "to shave", "rase rases rase rasons rasez rasent", "rasé", "e"],
  ["se laver", "to wash (oneself)", "lave laves lave lavons lavez lavent", "lavé", "e"],
  ["se préparer", "to get ready", "prépare prépares prépare préparons préparez préparent", "préparé", "e"],
  ["se promener", "to go for a walk", "promène promènes promène promenons promenez promènent", "promené", "e", "promèner"],
  ["s'occuper", "to take care (of)", "occupe occupes occupe occupons occupez occupent", "occupé", "e"],
  ["s'appeler", "to be called", "appelle appelles appelle appelons appelez appellent", "appelé", "e", "appeller"],
  // other common verbs
  ["dire", "to say", "dis dis dit disons dites disent", "dit", "a"],
  ["manger", "to eat", "mange manges mange mangeons mangez mangent", "mangé", "a"],
  ["commencer", "to begin", "commence commences commence commençons commencez commencent", "commencé", "a"],
  ["acheter", "to buy", "achète achètes achète achetons achetez achètent", "acheté", "a", "achèter"],
  ["préférer", "to prefer", "préfère préfères préfère préférons préférez préfèrent", "préféré", "a"],
  ["payer", "to pay", "paie|paye paies|payes paie|paye payons payez paient|payent", "payé", "a", "paier|payer"],
  ["envoyer", "to send", "envoie envoies envoie envoyons envoyez envoient", "envoyé", "a", "enverr"],
  ["finir", "to finish", "finis finis finit finissons finissez finissent", "fini", "a"],
  ["choisir", "to choose", "choisis choisis choisit choisissons choisissez choisissent", "choisi", "a"],
  ["dormir", "to sleep", "dors dors dort dormons dormez dorment", "dormi", "a"],
  ["offrir", "to give (a gift)", "offre offres offre offrons offrez offrent", "offert", "a"],
  ["ouvrir", "to open", "ouvre ouvres ouvre ouvrons ouvrez ouvrent", "ouvert", "a"],
  ["recevoir", "to receive", "reçois reçois reçoit recevons recevez reçoivent", "reçu", "a", "recevr"],
  ["conduire", "to drive", "conduis conduis conduit conduisons conduisez conduisent", "conduit", "a"],
  ["revenir", "to come back", "reviens reviens revient revenons revenez reviennent", "revenu", "e", "reviendr"],
  ["devenir", "to become", "deviens deviens devient devenons devenez deviennent", "devenu", "e", "deviendr"],
  ["rester", "to stay", "reste restes reste restons restez restent", "resté", "e"],
  ["arriver", "to arrive", "arrive arrives arrive arrivons arrivez arrivent", "arrivé", "e"],
  ["rentrer", "to go back home", "rentre rentres rentre rentrons rentrez rentrent", "rentré", "e"],
  ["tomber", "to fall", "tombe tombes tombe tombons tombez tombent", "tombé", "e"],
  ["naître", "to be born", "nais nais naît naissons naissez naissent", "né", "e", "naîtr"],
  ["mourir", "to die", "meurs meurs meurt mourons mourez meurent", "mort", "e", "mourr"],
  ["écouter", "to listen", "écoute écoutes écoute écoutons écoutez écoutent", "écouté", "a"],
  ["regarder", "to watch", "regarde regardes regarde regardons regardez regardent", "regardé", "a"],
  ["chercher", "to look for", "cherche cherches cherche cherchons cherchez cherchent", "cherché", "a"],
  ["oublier", "to forget", "oublie oublies oublie oublions oubliez oublient", "oublié", "a"],
];

// Cloze rows: [topic, sentence with [answer|alt](hint), english, optional instruction]
DATA.cloze = [
  // present tense test
  ["examen", "Je [travaille](travailler) le matin et je [lis](lire) le soir.", "I work in the morning and read in the evening."],
  ["examen", "Tu [chantes](chanter) bien quand tu [es](être) content.", "You sing well when you're happy."],
  ["examen", "Il [n'a pas](ne pas avoir) faim parce qu'il [mange](manger) beaucoup à midi.", "He isn't hungry because he eats a lot at lunchtime."],
  ["examen", "Nous [allons](aller) au parc où nos chiens [peuvent](pouvoir) courir.", "We go to the park where our dogs can run."],
  ["examen", "Qui [connaît|connait](connaître) la femme qui [habite](habiter) en face ?", "Who knows the woman who lives opposite?"],
  ["examen", "Vous [devez](devoir) partir tôt si vous [ne voulez pas](ne pas vouloir) rater le bus.", "You must leave early if you don't want to miss the bus."],
  ["examen", "Tu [bois](boire) du café le soir et tu [ne dors pas](ne pas dormir) bien.", "You drink coffee in the evening and you don't sleep well."],
  ["examen", "Elles [veulent](vouloir) savoir où tu [mets](mettre) les clés.", "They want to know where you put the keys."],
  ["examen", "Je [crois](croire) qu'il [pleut](pleuvoir) encore dehors.", "I think it's still raining outside."],
  ["examen", "Mes cousins et moi, nous [sortons](sortir) le samedi et nous [rentrons](rentrer) tard.", "My cousins and I go out on Saturdays and come home late."],
  ["examen", "Vous [ne comprenez pas](ne pas comprendre) pourquoi je [ris](rire).", "You don't understand why I'm laughing."],
  ["examen", "Tout le monde [sait](savoir) que ce restaurant [ferme](fermer) le lundi.", "Everyone knows this restaurant closes on Mondays."],
  ["examen", "Notre voisine [connaît|connait](connaître) bien la ville où nous [vivons](vivre).", "Our neighbour knows the town we live in well."],
  ["examen", "Ils [ne finissent pas](ne pas finir) leurs devoirs parce qu'ils [jouent](jouer) dehors.", "They don't finish their homework because they play outside."],
  ["examen", "Je [prends](prendre) le métro quand tu [viens](venir) en voiture.", "I take the metro when you come by car."],
  ["examen", "Elle [n'écoute pas](ne pas écouter) la musique que son frère [aime](aimer).", "She doesn't listen to the music her brother likes."],
  ["examen", "Vous [voyez](voir) ce chat qui [dort](dormir) sur le toit ?", "Do you see that cat sleeping on the roof?"],
  ["examen", "Nous [attendons](attendre) le colis que la poste nous [envoie](envoyer).", "We're waiting for the parcel the post office is sending us."],
  ["examen", "Ils [ne reçoivent pas](ne pas recevoir) les lettres que tu leur [écris](écrire).", "They don't get the letters you write to them."],
  ["examen", "Elles [achètent](acheter) les fruits que le marchand [vend](vendre) au marché.", "They buy the fruit the stallholder sells at the market."],
  ["examen", "Tu [ne réponds pas](ne pas répondre) quand ta mère t'[appelle](appeler).", "You don't answer when your mother calls you."],
  ["examen", "Je [me lève](se lever) à sept heures et ensuite je [me brosse](se brosser) les dents.", "I get up at seven and then brush my teeth."],
  ["examen", "Vous [ne vous reposez pas](ne pas se reposer) assez et vous [vous couchez](se coucher) trop tard.", "You don't rest enough and you go to bed too late."],
  ["examen", "Les enfants [s'amusent](s'amuser) pendant que leurs parents [font](faire) les courses.", "The children have fun while their parents do the shopping."],
  ["examen", "On [ne doit pas](ne pas devoir) croire tout ce qu'on [lit](lire) sur Internet.", "We mustn't believe everything we read online."],

  // présent
  ["présent", "Je [parle](parler) un peu espagnol.", "I speak a little Spanish."],
  ["présent", "Et toi, quel sport est-ce que tu [pratiques](pratiquer) ?", "And you, what sport do you do?"],
  ["présent", "Ils [aiment](aimer) leurs enfants.", "They love their children."],
  ["présent", "Ils [adorent](adorer) faire la cuisine.", "They love cooking."],
  ["présent", "Vous [habitez](habiter) où ?", "Where do you live?"],
  ["présent", "J'[ai](avoir) mal à la tête.", "I have a headache."],
  ["présent", "Tu [as](avoir) quel âge ?", "How old are you?"],
  ["présent", "Elles [ont](avoir) chaud.", "They are hot."],
  ["présent", "Je [vais](aller) chez ma grand-mère tous les dimanches.", "I go to my grandmother's every Sunday."],
  ["présent", "Vous [allez](aller) au travail en métro.", "You go to work by metro."],
  ["présent", "Isabelle ne [vient](venir) pas ce soir.", "Isabelle isn't coming tonight."],
  ["présent", "Nous [venons](venir) d'Iran.", "We come from Iran."],
  ["présent", "Nous [faisons](faire) les courses tous les dimanches.", "We do the shopping every Sunday."],
  ["présent", "Vous ne [faites](faire) pas la vaisselle après le dîner ?", "Don't you do the dishes after dinner?"],
  ["présent", "Ils [écrivent](écrire) leurs prénoms au tableau.", "They write their first names on the board."],
  ["présent", "Le soir, nous [lisons](lire) un roman.", "In the evening, we read a novel."],
  ["présent", "Il [prend](prendre) des médicaments depuis une semaine.", "He's been taking medicine for a week."],
  ["présent", "Vous [apprenez](apprendre) le piano depuis quand ?", "Since when have you been learning the piano?"],
  ["présent", "Je ne [comprends](comprendre) pas.", "I don't understand."],
  ["présent", "Je [vois](voir) mes cousins une fois par mois.", "I see my cousins once a month."],
  ["présent", "Le bus pour l'aéroport [part](partir) toutes les vingt minutes.", "The airport bus leaves every twenty minutes."],
  ["présent", "Vous [sortez](sortir) le chien avant le petit-déjeuner.", "You take the dog out before breakfast."],
  ["présent", "Est-ce que vous [connaissez](connaître) cette actrice ?", "Do you know this actress?"],
  ["présent", "Nous [voulons](vouloir) apprendre le français.", "We want to learn French."],
  ["présent", "Elles [doivent](devoir) finir ce projet avant vendredi.", "They have to finish this project before Friday."],
  ["présent", "Ma mère [sait](savoir) conduire.", "My mother knows how to drive."],
  ["présent", "Ils ne [savent](savoir) pas où ils ont garé la voiture.", "They don't know where they parked the car."],
  ["présent", "Vous [buvez](boire) du thé tous les matins.", "You drink tea every morning."],
  ["présent", "Les musulmans ne [boivent](boire) pas d'alcool.", "Muslims don't drink alcohol."],
  ["présent", "Ma sœur [met](mettre) toujours trop de sel dans la soupe.", "My sister always puts too much salt in the soup."],
  ["présent", "J'[attends](attendre) le bus tous les jours.", "I wait for the bus every day."],
  ["présent", "Est-ce que tu [entends](entendre) ce bruit ?", "Do you hear that noise?"],
  ["présent", "Est-ce que vous [vendez](vendre) des boissons alcoolisées ?", "Do you sell alcoholic drinks?"],
  ["présent", "Ils ne [répondent](répondre) jamais au téléphone.", "They never answer the phone."],
  ["présent", "Ils [vivent](vivre) avec beaucoup de difficultés.", "They live with many difficulties."],
  ["présent", "Il [faut](falloir) boire beaucoup d'eau.", "You have to drink lots of water."],
  ["présent", "Nous [croyons](croire) en la liberté.", "We believe in freedom."],
  ["présent", "Tu me [manques](manquer).", "I miss you."],
  ["présent", "Est-ce que je te [plais](plaire) ?", "Do you like me?"],
  ["présent", "Je [me lève](se lever) à 6h30.", "I get up at 6:30."],
  ["présent", "Je [me couche](se coucher) normalement vers 11h.", "I usually go to bed around 11."],
  ["présent", "Tu [te maquilles](se maquiller).", "You put on make-up."],
  ["présent", "On [s'aime](s'aimer).", "We love each other."],
  ["présent", "Je [m'occupe](s'occuper) des boissons.", "I'll take care of the drinks."],
  ["présent", "Nous [mangeons](manger) au restaurant ce soir.", "We're eating at the restaurant tonight."],
  ["présent", "Nous [commençons](commencer) le cours à 10h.", "We start the class at 10."],
  ["présent", "Tu [achètes](acheter) du pain ?", "Are you buying bread?"],
  ["présent", "Je [paie|paye](payer) par carte.", "I pay by card."],

  // passé récent / futur proche
  ["venir de / aller", "Je [viens de](passé récent) parler à ma mère.", "I just spoke to my mother."],
  ["venir de / aller", "Le métro [vient de](passé récent) partir.", "The metro just left."],
  ["venir de / aller", "Je [viens de me](passé récent) réveiller.", "I just woke up."],
  ["venir de / aller", "Vous [venez de vous](passé récent) raser.", "You just shaved."],
  ["venir de / aller", "Nous [venons d'](passé récent)avoir un bébé.", "We just had a baby."],
  ["venir de / aller", "Ils [vont entendre](futur proche · entendre) du bruit.", "They're going to hear noise."],
  ["venir de / aller", "Elle [va boire](futur proche · boire) du vin.", "She's going to drink wine."],
  ["venir de / aller", "Je [ne vais pas me marier](futur proche, négatif · se marier) cette année.", "I'm not going to get married this year."],
  ["venir de / aller", "Mes parents [viennent de](passé récent) faire les courses.", "My parents just did the shopping."],
  ["venir de / aller", "Ma sœur [vient de](passé récent) passer l'aspirateur.", "My sister just vacuumed."],
  ["venir de / aller", "Tu [vas apporter](futur proche · apporter) des disques.", "You're going to bring records."],
  ["venir de / aller", "Vous [allez chanter](futur proche · chanter) une chanson d'anniversaire.", "You're going to sing a birthday song."],
  ["venir de / aller", "Elles [ne vont pas pouvoir](futur proche, négatif · pouvoir) conduire.", "They won't be able to drive."],

  // passé composé
  ["passé composé", "Hier, j'[ai mangé](manger) au restaurant.", "Yesterday I ate at the restaurant."],
  ["passé composé", "Elle [est allée](aller) au cinéma avec ses amis.", "She went to the cinema with her friends."],
  ["passé composé", "Nous [avons pris](prendre) le train pour Montréal.", "We took the train to Montreal."],
  ["passé composé", "Ils [sont arrivés](arriver) en retard.", "They arrived late."],
  ["passé composé", "Tu [as fait](faire) tes devoirs ?", "Did you do your homework?"],
  ["passé composé", "Je [me suis levé|me suis levée](se lever) à 7h ce matin.", "I got up at 7 this morning."],
  ["passé composé", "Elle [s'est maquillée](se maquiller) avant la fête.", "She put on make-up before the party."],
  ["passé composé", "Vous [avez vu](voir) ce film ?", "Have you seen this film?"],
  ["passé composé", "Elle [est née](naître) le 15 juin 1989.", "She was born on 15 June 1989."],
  ["passé composé", "J'[ai cassé](casser) une assiette en faisant la vaisselle.", "I broke a plate while doing the dishes."],
  ["passé composé", "Tu m'[as manqué|as manquée](manquer).", "I missed you."],
  ["passé composé", "Est-ce que ça t'[a plu](plaire) ?", "Did you like it?"],
  ["passé composé", "Ils [ne sont pas venus](ne pas venir) hier soir.", "They didn't come last night."],
  ["passé composé", "Nous [avons bu](boire) un verre ensemble.", "We had a drink together."],
  ["passé composé", "L'hiver dernier, je [suis allé|suis allée](aller) en Norvège.", "Last winter I went to Norway."],
  ["passé composé", "Elles [sont restées](rester) à la maison.", "They stayed home."],
  ["passé composé", "J'[ai lu](lire) le livre que tu m'as offert.", "I read the book you gave me."],
  ["passé composé", "On [a dû](devoir) partir tôt.", "We had to leave early."],

  // imparfait / futur simple / conditionnel
  ["imparfait", "Quand j'étais petit, je [jouais](jouer) au football.", "When I was little, I played football."],
  ["imparfait", "Avant, nous [habitions](habiter) à Téhéran.", "Before, we lived in Tehran."],
  ["imparfait", "C'est le facteur qui [apportait](apporter) le journal chaque matin.", "That's the postman who brought the newspaper every morning."],
  ["imparfait", "Tu [étais](être) fatigué hier soir.", "You were tired last night."],
  ["imparfait", "Elles [faisaient](faire) la cuisine tous les dimanches.", "They used to cook every Sunday."],
  ["imparfait", "Il [fallait](falloir) partir tôt.", "We had to leave early."],
  ["imparfait", "Vous [aviez](avoir) une voiture rouge.", "You had a red car."],
  ["futur simple", "Demain, je [serai](être) à Paris.", "Tomorrow I'll be in Paris."],
  ["futur simple", "Nous [viendrons](venir) avec les enfants.", "We'll come with the children."],
  ["futur simple", "Tu [iras](aller) chez le médecin.", "You'll go to the doctor."],
  ["futur simple", "Il [faudra](falloir) acheter du pain.", "We'll need to buy bread."],
  ["futur simple", "Vous [ferez](faire) les courses samedi.", "You'll do the shopping on Saturday."],
  ["futur simple", "Je [verrai](voir) mes parents l'été prochain.", "I'll see my parents next summer."],
  ["futur simple", "Ils [pourront](pouvoir) venir plus tard.", "They'll be able to come later."],
  ["futur simple", "Elle [aura](avoir) 30 ans en mai.", "She'll be 30 in May."],
  ["conditionnel", "Je [voudrais](vouloir) un café, s'il vous plaît.", "I'd like a coffee, please."],
  ["conditionnel", "[Pourriez](pouvoir)-vous m'aider ?", "Could you help me?"],
  ["conditionnel", "Nous [aimerions](aimer) organiser des vacances à la mer.", "We'd like to organise a holiday at the seaside."],
  ["conditionnel", "Tu [devrais](devoir) arrêter de fumer.", "You should stop smoking."],
  ["conditionnel", "Il [faudrait](falloir) partir maintenant.", "We ought to leave now."],
  ["conditionnel", "Je [pourrais](pouvoir) avoir un verre ?", "Could I have a glass?"],
  ["conditionnel", "Elle [adorerait](adorer) visiter le Québec.", "She would love to visit Quebec."],
  ["conditionnel", "Vous [feriez](faire) quoi à ma place ?", "What would you do in my place?"],
  ["conditionnel", "J'[irais](aller) avec toi, mais je suis malade.", "I'd go with you, but I'm sick."],

  // impératif
  ["impératif", "[Parlez](parler, vous) plus fort, s'il vous plaît.", "Speak louder, please."],
  ["impératif", "[Parlons](parler, nous) d'un autre sujet.", "Let's talk about something else."],
  ["impératif", "[Allons](aller, nous)-y !", "Let's go!"],
  ["impératif", "[Vas](aller, tu)-y !", "Go on!"],
  ["impératif", "Ne [dors](dormir, tu) pas dans la classe !", "Don't sleep in class!"],
  ["impératif", "[Repose](se reposer, tu)-toi.", "Rest."],
  ["impératif", "Ne [vous reposez](se reposer, vous) pas.", "Don't rest."],
  ["impératif", "N'[aie](avoir, tu) pas peur !", "Don't be afraid!"],
  ["impératif", "[Soyez](être, vous) prudents !", "Be careful!"],
  ["impératif", "[Sois](être, tu) poli !", "Be polite!"],
  ["impératif", "[Prends](prendre, tu) soin de toi !", "Take care of yourself!"],
  ["impératif", "[Mange](manger, tu) tes légumes !", "Eat your vegetables!"],
  ["impératif", "[Attendez](attendre, vous), s'il vous plaît !", "Wait, please!"],
  ["impératif", "[Sors](sortir, tu) de ma chambre !", "Get out of my room!"],
  ["impératif", "[Mets](mettre, tu) ton manteau, il fait froid dehors.", "Put your coat on, it's cold outside."],
  ["impératif", "[Descends](descendre, tu) ! Je suis là.", "Come down! I'm here."],
  ["impératif", "[Lève](se lever, tu)-toi, il est tard !", "Get up, it's late!"],
  ["impératif", "[Habillez](s'habiller, vous)-vous vite !", "Get dressed quickly!"],

  // questions
  ["questions", "[Où habitez-vous ?]", "Where do you live?", "Formel (inversion) : « Vous habitez où ? »"],
  ["questions", "[Où est-ce que vous habitez ?]", "Where do you live?", "Standard (est-ce que) : « Vous habitez où ? »"],
  ["questions", "[Parlez-vous français ?]", "Do you speak French?", "Formel (inversion) : « Vous parlez français ? »"],
  ["questions", "[Est-ce que tu parles français ?]", "Do you speak French?", "Standard (est-ce que) : « Tu parles français ? »"],
  ["questions", "[A-t-il une voiture ?]", "Does he have a car?", "Formel (inversion) : « Il a une voiture ? »"],
  ["questions", "[Y a-t-il beaucoup de monde ?]", "Are there a lot of people?", "Formel (inversion) : « Il y a beaucoup de monde ? »"],
  ["questions", "[Que faites-vous dans la vie ?]", "What do you do for a living?", "Formel (inversion) : « Vous faites quoi dans la vie ? »"],
  ["questions", "[Qu'est-ce que vous faites dans la vie ?]", "What do you do for a living?", "Standard (est-ce que) : « Vous faites quoi dans la vie ? »"],
  ["questions", "[Vous faites quoi dans la vie ?]", "What do you do for a living?", "Familier (intonation) : « Que faites-vous dans la vie ? »"],
  ["questions", "[Pourquoi apprenez-vous le français ?]", "Why are you learning French?", "Formel (inversion) : « Pourquoi vous apprenez le français ? »"],
  ["questions", "[Où va-t-elle après les cours ?]", "Where does she go after class?", "Formel (inversion) : « Elle va où après les cours ? »"],
  ["questions", "[Comment s'appelle-t-il ?]", "What's his name?", "Formel (inversion) : « Il s'appelle comment ? »"],
  ["questions", "[Qu'est-ce que tu regardes à la télé ?]", "What are you watching on TV?", "Standard (est-ce que) : « Tu regardes quoi à la télé ? »"],
  ["questions", "[Quel train prends-tu le matin ?]", "Which train do you take in the morning?", "Formel (inversion) : « Tu prends quel train le matin ? »"],
  ["questions", "[Commence-t-elle à 10h ?]", "Does it start at 10?", "Formel (inversion) : « Elle commence à 10h ? »"],
  ["questions", "[Puis-je vous aider ?]", "May I help you?", "Formel (inversion) : « Je peux vous aider ? »"],
  ["questions", "[Quelle](quel?) est votre adresse ?", "What's your address?"],
  ["questions", "[Quels](quel?) sont vos loisirs ?", "What are your hobbies?"],
  ["questions", "[Quel](quel?) âge avez-vous ?", "How old are you?"],
  ["questions", "[Quelles](quel?) activités faites-vous après le travail ?", "What activities do you do after work?"],
  ["questions", "[Quelle](quel?) est votre profession ?", "What's your profession?"],
  ["questions", "[Combien](how much) gagnez-vous par mois ?", "How much do you earn per month?"],
  ["questions", "[Pourquoi](why) es-tu triste ?", "Why are you sad?"],
  ["questions", "Tu fais [quoi](what) ce soir ?", "What are you doing tonight?"],

  // relatifs qui / que / où
  ["relatifs", "J'ai une amie [qui](relatif) parle quatre langues.", "I have a friend who speaks four languages."],
  ["relatifs", "Elle adore la maison [que](relatif) vous venez d'acheter.", "She loves the house you just bought."],
  ["relatifs", "Je n'aime pas les films [qui](relatif) finissent mal.", "I don't like films that end badly."],
  ["relatifs", "Voici le livre [que](relatif) tu m'as prêté.", "Here's the book you lent me."],
  ["relatifs", "Fabrice travaille dans un salon [qui](relatif) s'appelle Créatifs.", "Fabrice works in a salon called Créatifs."],
  ["relatifs", "Aline a acheté un appartement [qu'](relatif)elle adore.", "Aline bought an apartment she loves."],
  ["relatifs", "Nous sommes à la maison [où](relatif) les enfants peuvent jouer.", "We're at the house where the children can play."],
  ["relatifs", "Paul, c'est un collègue [que](relatif) j'apprécie beaucoup.", "Paul is a colleague I really like."],
  ["relatifs", "Tania, c'est une fille [qui](relatif) est photographe.", "Tania is a girl who's a photographer."],
  ["relatifs", "C'est la ville [où](relatif) je suis né.", "It's the city where I was born."],
  ["relatifs", "Malik, c'est un garçon [que](relatif) les études intéressent.", "Malik is a boy who is interested in studies."],
  ["relatifs", "Le film [dont](relatif) je te parle est excellent.", "The film I'm telling you about is excellent."],

  // démonstratifs
  ["démonstratifs", "Je préfère [celui](pronom démonstratif) qui est italien. (le restaurant)", "I prefer the one that's Italian."],
  ["démonstratifs", "Elle va acheter [celle](pronom démonstratif) dans la vitrine. (la chemise)", "She's going to buy the one in the window."],
  ["démonstratifs", "Je vais apporter [ceux](pronom démonstratif) en noir. (les vêtements)", "I'm going to bring the black ones."],
  ["démonstratifs", "Non, ce ne sont pas [celles](pronom démonstratif) que je préfère. (les chaussures)", "No, those aren't the ones I prefer."],
  ["démonstratifs", "Non, ce n'est pas [celui](pronom démonstratif) qui m'intéresse. (le livre)", "No, that's not the one that interests me."],
  ["démonstratifs", "Voici le projet de Malek et [celui](pronom démonstratif) de Nina.", "Here's Malek's project and Nina's."],
  ["démonstratifs", "[Cet](adjectif démonstratif) homme est mon professeur.", "This man is my teacher."],
  ["démonstratifs", "[Cette](adjectif démonstratif) chemise est trop petite.", "This shirt is too small."],
  ["démonstratifs", "[Ces](adjectif démonstratif) lunettes sont à moi.", "These glasses are mine."],
  ["démonstratifs", "[Ce](adjectif démonstratif) livre est intéressant.", "This book is interesting."],
  ["démonstratifs", "Il y a [ceux](pronom démonstratif) qui préfèrent les vêtements classiques.", "There are those who prefer classic clothes."],

  // possessifs
  ["possessifs", "C'est [mon](my) école.", "It's my school."],
  ["possessifs", "Je suis avec [mon](my) amie Sarah.", "I'm with my friend Sarah."],
  ["possessifs", "Elle parle avec [sa](her) mère.", "She's talking with her mother."],
  ["possessifs", "Il aime [sa](his) voiture.", "He loves his car."],
  ["possessifs", "Vous écrivez une lettre à [vos](your, pl.) amis.", "You write a letter to your friends."],
  ["possessifs", "Ils écrivent [leurs](their) prénoms au tableau.", "They write their first names on the board."],
  ["possessifs", "Nous aimons [notre](our) quartier.", "We like our neighbourhood."],
  ["possessifs", "Tu aimes [ton](your) mari.", "You love your husband."],
  ["possessifs", "Prends soin de [tes](your) enfants.", "Take care of your children."],

  // articles / partitif
  ["articles", "J'aime [le](article) café.", "I like coffee."],
  ["articles", "Il faut [de la](partitif) farine.", "We need flour."],
  ["articles", "Je mange [du](partitif) poisson le vendredi.", "I eat fish on Fridays."],
  ["articles", "Je n'ai pas [de](négation) frères.", "I don't have any brothers."],
  ["articles", "Il faut boire beaucoup [d'](quantité)eau.", "You have to drink lots of water."],
  ["articles", "Elle a [une](article) voiture rouge.", "She has a red car."],
  ["articles", "Je fais [du](faire + sport) sport le week-end.", "I play sports on the weekend."],
  ["articles", "Tu fais [de la](faire + activité) natation.", "You go swimming."],
  ["articles", "J'adore [les](article) macarons.", "I love macarons."],
  ["articles", "Je vais [au](à + le) travail en bus.", "I go to work by bus."],
  ["articles", "Il a mal [aux](à + les) dents.", "He has a toothache."],
  ["articles", "Tu as mal [au](à + le) dos.", "Your back hurts."],
  ["articles", "Je vais [à la](à + la) boulangerie.", "I'm going to the bakery."],
  ["articles", "Ils viennent [du](de + le) Canada.", "They come from Canada."],
  ["articles", "Je voudrais un peu [de](quantité) sel.", "I'd like a little salt."],

  // prépositions + lieux
  ["prépositions", "J'habite [à](ville) Téhéran.", "I live in Tehran."],
  ["prépositions", "J'habite [en](pays) France.", "I live in France."],
  ["prépositions", "J'habite [au](pays) Canada.", "I live in Canada."],
  ["prépositions", "J'habite [aux](pays) États-Unis.", "I live in the United States."],
  ["prépositions", "J'habite [en](pays) Iran.", "I live in Iran."],
  ["prépositions", "Il travaille [au](pays) Portugal.", "He works in Portugal."],
  ["prépositions", "Elles partent [en](pays) Thaïlande.", "They're leaving for Thailand."],
  ["prépositions", "Je vais [en](pays) Grèce.", "I'm going to Greece."],
  ["prépositions", "Nous sommes nés [aux](pays) États-Unis.", "We were born in the United States."],
  ["prépositions", "Elle préfère vivre [en](pays) Italie.", "She prefers living in Italy."],
  ["prépositions", "Il habite [au](pays) Sénégal.", "He lives in Senegal."],
  ["prépositions", "Mon frère est [à](ville) San Francisco.", "My brother is in San Francisco."],
  ["prépositions", "Je suis [chez](à la maison de) mon ami.", "I'm at my friend's place."],
  ["prépositions", "Je vais [chez](magasin de) le boulanger.", "I'm going to the baker's."],
  ["prépositions", "Je viens [d'](pays)Iran.", "I come from Iran."],
  ["prépositions", "Il vient [du](pays) Brésil.", "He comes from Brazil."],

  // tout / toute / tous / toutes
  ["tout", "Je travaille [tous](tout) les jours.", "I work every day."],
  ["tout", "Elle écoute l'album [toute](tout) la journée.", "She listens to the album all day."],
  ["tout", "[Tout](tout) le monde est amoureux d'elle.", "Everyone is in love with her."],
  ["tout", "J'ai écouté [toutes](tout) les chansons.", "I listened to all the songs."],
  ["tout", "Il ferme [toutes](tout) les fenêtres.", "He closes all the windows."],
  ["tout", "J'adore [tous](tout) ses films.", "I love all her films."],
  ["tout", "Elles sont [toutes](tout) les deux étudiantes en médecine.", "Both of them are medical students."],
  ["tout", "Je ne comprends pas du [tout](tout).", "I don't understand at all."],

  // pronoms toniques
  ["pronoms toniques", "Non, [lui](il), il travaille au Portugal.", "No, he works in Portugal."],
  ["pronoms toniques", "Non, [moi](je), je vais en Grèce.", "No, I'm going to Greece."],
  ["pronoms toniques", "Non, [elles](elles), elles partent avec nous.", "No, they're leaving with us."],
  ["pronoms toniques", "Je vais au cinéma avec [toi](tu).", "I'm going to the cinema with you."],
  ["pronoms toniques", "Ce cadeau est pour [eux](ils).", "This gift is for them."],
  ["pronoms toniques", "Elle est assise devant [nous](nous).", "She's sitting in front of us."],
  ["pronoms toniques", "Je pars sans [elle](elle).", "I'm leaving without her."],

  // depuis / il y a / pendant
  ["expressions du temps", "J'étudie le français [depuis](since/for) 2 ans.", "I've been studying French for 2 years."],
  ["expressions du temps", "Je suis professeur de français [depuis](since/for) 11 ans.", "I've been a French teacher for 11 years."],
  ["expressions du temps", "J'ai visité ce musée [il y a](ago) trois ans.", "I visited this museum three years ago."],
  ["expressions du temps", "J'ai habité à Paris [pendant](during) trois ans.", "I lived in Paris for three years."],
  ["expressions du temps", "Je suis arrivé au Canada [il y a](ago) deux ans.", "I arrived in Canada two years ago."],
  ["expressions du temps", "J'apprends le polonais [depuis](since/for) un mois.", "I've been learning Polish for a month."],
  ["expressions du temps", "Je bois un café [avant de](before) commencer ma journée.", "I drink a coffee before starting my day."],
  ["expressions du temps", "Il va [bientôt](soon) entrer à la fac.", "He'll soon start university."],

  // adjectifs
  ["adjectifs", "Nous avons acheté une [vieille](vieux) voiture à un voisin.", "We bought an old car from a neighbour."],
  ["adjectifs", "J'ai acheté un [joli](joli) pull.", "I bought a pretty sweater."],
  ["adjectifs", "Il cherche un [petit](petit) studio près de son travail.", "He's looking for a small studio near work."],
  ["adjectifs", "Mon frère m'a offert un [beau](beau) livre pour mon anniversaire.", "My brother gave me a beautiful book for my birthday."],
  ["adjectifs", "C'est un [bel](beau) homme.", "He's a handsome man."],
  ["adjectifs", "J'ai une [nouvelle](nouveau) voiture.", "I have a new car."],
  ["adjectifs", "C'est un [nouvel](nouveau) appartement.", "It's a new apartment."],
  ["adjectifs", "Elle est [iranienne](iranien).", "She's Iranian."],
  ["adjectifs", "Ce sont des chaussures [italiennes](italien).", "They're Italian shoes."],
  ["adjectifs", "Je suis [nul|nulle](nul) en maths.", "I'm terrible at maths."],
  ["adjectifs", "Elle a la peau [sèche](sec).", "She has dry skin."],
];

// Vocabulary: [french (with article), english, theme]
DATA.vocab = [
  // la routine
  ["se réveiller", "to wake up", "La routine"], ["se lever", "to get up", "La routine"], ["se brosser les dents", "to brush one's teeth", "La routine"],
  ["prendre une douche", "to take a shower", "La routine"], ["prendre un bain", "to take a bath", "La routine"], ["se sécher les cheveux", "to dry one's hair", "La routine"],
  ["se peigner", "to comb one's hair", "La routine"], ["se raser", "to shave", "La routine"], ["s'habiller", "to get dressed", "La routine"],
  ["se déshabiller", "to get undressed", "La routine"], ["mettre le réveil", "to set the alarm", "La routine"], ["se coucher", "to go to bed", "La routine"],
  ["faire la sieste", "to take a nap", "La routine"], ["la brosse à dents", "toothbrush", "La routine"], ["le dentifrice", "toothpaste", "La routine"],
  ["le rasoir", "razor", "La routine"], ["le sèche-cheveux", "hair dryer", "La routine"], ["la baignoire", "bathtub", "La routine"],
  ["le maquillage", "make-up", "La routine"], ["prêt", "ready", "La routine"], ["sec", "dry", "La routine"], ["mouillé", "wet", "La routine"],
  // les tâches ménagères
  ["faire le ménage", "to clean the house", "Les tâches ménagères"], ["faire la vaisselle", "to do the dishes", "Les tâches ménagères"],
  ["faire la cuisine", "to cook", "Les tâches ménagères"], ["faire les courses", "to do the groceries", "Les tâches ménagères"],
  ["faire la lessive", "to do the laundry", "Les tâches ménagères"], ["faire le lit", "to make the bed", "Les tâches ménagères"],
  ["passer l'aspirateur", "to vacuum", "Les tâches ménagères"], ["repasser", "to iron", "Les tâches ménagères"],
  ["plier le linge", "to fold the laundry", "Les tâches ménagères"], ["ranger", "to tidy up", "Les tâches ménagères"],
  ["nettoyer", "to clean", "Les tâches ménagères"], ["sortir les poubelles", "to take out the trash", "Les tâches ménagères"],
  ["le fer à repasser", "iron", "Les tâches ménagères"], ["une tâche", "task", "Les tâches ménagères"], ["une tache", "stain", "Les tâches ménagères"],
  // le temps
  ["quotidien", "daily", "Le temps"], ["hebdomadaire", "weekly", "Le temps"], ["mensuel", "monthly", "Le temps"], ["annuel", "yearly", "Le temps"],
  ["le lendemain", "the day after", "Le temps"], ["la veille", "the day before", "Le temps"], ["hier", "yesterday", "Le temps"], ["demain", "tomorrow", "Le temps"],
  ["la semaine dernière", "last week", "Le temps"], ["le mois prochain", "next month", "Le temps"], ["le printemps", "spring", "Le temps"],
  ["l'été", "summer", "Le temps"], ["l'automne", "autumn", "Le temps"], ["l'hiver", "winter", "Le temps"], ["lundi", "Monday", "Le temps"],
  ["mercredi", "Wednesday", "Le temps"], ["jeudi", "Thursday", "Le temps"], ["samedi", "Saturday", "Le temps"], ["dimanche", "Sunday", "Le temps"],
  ["en avance", "early", "Le temps"], ["en retard", "late", "Le temps"], ["à l'heure", "on time", "Le temps"], ["parfois", "sometimes", "Le temps"],
  ["souvent", "often", "Le temps"], ["jamais", "never", "Le temps"], ["tôt", "early", "Le temps"], ["tard", "late (in the day)", "Le temps"],
  // les commerces et la nourriture
  ["la boulangerie", "bakery", "Commerces et nourriture"], ["la boucherie", "butcher's shop", "Commerces et nourriture"],
  ["la poissonnerie", "fish shop", "Commerces et nourriture"], ["la pâtisserie", "pastry shop", "Commerces et nourriture"],
  ["la charcuterie", "deli (pork products)", "Commerces et nourriture"], ["le poisson", "fish", "Commerces et nourriture"],
  ["le poison", "poison", "Commerces et nourriture"], ["la crevette", "shrimp", "Commerces et nourriture"], ["le porc", "pork", "Commerces et nourriture"],
  ["le veau", "veal", "Commerces et nourriture"], ["la vache", "cow", "Commerces et nourriture"], ["le canard", "duck", "Commerces et nourriture"],
  ["un œuf", "an egg", "Commerces et nourriture"], ["le sel", "salt", "Commerces et nourriture"], ["le poivre", "pepper", "Commerces et nourriture"],
  ["l'huile d'olive", "olive oil", "Commerces et nourriture"], ["la farine", "flour", "Commerces et nourriture"], ["le romarin", "rosemary", "Commerces et nourriture"],
  ["cru", "raw", "Commerces et nourriture"], ["cuit", "cooked", "Commerces et nourriture"], ["frais", "fresh", "Commerces et nourriture"],
  ["salé", "salty", "Commerces et nourriture"], ["éplucher", "to peel", "Commerces et nourriture"], ["mélanger", "to mix", "Commerces et nourriture"],
  ["avaler", "to swallow", "Commerces et nourriture"], ["la poire", "pear", "Commerces et nourriture"], ["la pomme", "apple", "Commerces et nourriture"],
  ["la fraise", "strawberry", "Commerces et nourriture"], ["la cerise", "cherry", "Commerces et nourriture"], ["le citron", "lemon", "Commerces et nourriture"],
  ["le raisin", "grapes", "Commerces et nourriture"], ["l'ananas", "pineapple", "Commerces et nourriture"], ["la myrtille", "blueberry", "Commerces et nourriture"],
  ["la grenade", "pomegranate", "Commerces et nourriture"], ["la pomme de terre", "potato", "Commerces et nourriture"],
  ["les lentilles", "lentils", "Commerces et nourriture"], ["le riz", "rice", "Commerces et nourriture"], ["la viande", "meat", "Commerces et nourriture"],
  ["gourmand", "greedy (for food)", "Commerces et nourriture"],
  // objets
  ["le sac à dos", "backpack", "Les objets"], ["le sac à main", "handbag", "Les objets"], ["le portefeuille", "wallet", "Les objets"],
  ["le porte-monnaie", "coin purse", "Les objets"], ["le stylo", "pen", "Les objets"], ["le crayon", "pencil", "Les objets"],
  ["la feuille", "sheet (of paper)", "Les objets"], ["le portable", "cell phone", "Les objets"], ["le briquet", "lighter", "Les objets"],
  ["l'allumette", "match", "Les objets"], ["le mouchoir", "tissue", "Les objets"], ["les ciseaux", "scissors", "Les objets"],
  ["le peigne", "comb", "Les objets"], ["l'agenda", "planner", "Les objets"], ["les lunettes de soleil", "sunglasses", "Les objets"],
  ["les clés", "keys", "Les objets"], ["le parapluie", "umbrella", "Les objets"], ["l'enveloppe", "envelope", "Les objets"],
  ["la bougie", "candle", "Les objets"], ["le cahier", "notebook", "Les objets"], ["commode", "handy, practical", "Les objets"],
  // logement & ville
  ["louer", "to rent", "Logement et ville"], ["le loyer", "rent", "Logement et ville"], ["le locataire", "tenant", "Logement et ville"],
  ["la banlieue", "suburbs", "Logement et ville"], ["le quartier", "neighbourhood", "Logement et ville"], ["le studio", "studio apartment", "Logement et ville"],
  ["l'agence immobilière", "real estate agency", "Logement et ville"], ["l'étage", "floor (level)", "Logement et ville"],
  ["la salle de bains", "bathroom", "Logement et ville"], ["la salle à manger", "dining room", "Logement et ville"],
  ["l'armoire", "wardrobe", "Logement et ville"], ["le placard", "cupboard", "Logement et ville"], ["le voisin", "neighbour", "Logement et ville"],
  ["l'arrêt de bus", "bus stop", "Logement et ville"], ["le pont", "bridge", "Logement et ville"], ["au coin de la rue", "at the corner of the street", "Logement et ville"],
  ["au bout du couloir", "at the end of the hallway", "Logement et ville"], ["à gauche", "on the left", "Logement et ville"], ["tout droit", "straight ahead", "Logement et ville"],
  ["le magasin", "store", "Logement et ville"], ["le magazine", "magazine", "Logement et ville"],
  // famille & état civil
  ["l'arbre généalogique", "family tree", "Famille et état civil"], ["les jumeaux", "twins", "Famille et état civil"],
  ["l'aîné", "the eldest", "Famille et état civil"], ["le cadet", "the youngest", "Famille et état civil"], ["le gendre", "son-in-law", "Famille et état civil"],
  ["la belle-fille", "daughter-in-law", "Famille et état civil"], ["le petit-fils", "grandson", "Famille et état civil"],
  ["la grand-mère", "grandmother", "Famille et état civil"], ["célibataire", "single", "Famille et état civil"], ["divorcé", "divorced", "Famille et état civil"],
  ["veuf", "widower", "Famille et état civil"], ["être à la retraite", "to be retired", "Famille et état civil"], ["partir à la retraite", "to retire", "Famille et état civil"],
  ["être au chômage", "to be unemployed", "Famille et état civil"], ["le lycéen", "high-school student", "Famille et état civil"],
  ["l'état civil", "marital status", "Famille et état civil"], ["le copain", "boyfriend / buddy", "Famille et état civil"],
  // métiers
  ["l'infirmière", "nurse (f)", "Les métiers"], ["le boulanger", "baker", "Les métiers"], ["la caissière", "cashier (f)", "Les métiers"],
  ["le plombier", "plumber", "Les métiers"], ["l'ingénieur", "engineer", "Les métiers"], ["le vendeur", "salesman", "Les métiers"],
  ["la serveuse", "waitress", "Les métiers"], ["l'informaticien", "IT specialist", "Les métiers"], ["le pompier", "firefighter", "Les métiers"],
  ["l'avocat", "lawyer", "Les métiers"], ["le mécanicien", "mechanic", "Les métiers"], ["le coiffeur", "hairdresser", "Les métiers"],
  ["le gérant", "manager (of a shop)", "Les métiers"], ["le chanteur", "singer", "Les métiers"], ["le doctorant", "PhD student", "Les métiers"],
  // vêtements & mode
  ["les vêtements", "clothes", "Vêtements et mode"], ["la mode", "fashion", "Vêtements et mode"], ["le mode", "mode (setting)", "Vêtements et mode"],
  ["à la mode", "fashionable", "Vêtements et mode"], ["démodé", "out of fashion", "Vêtements et mode"], ["le pull", "sweater", "Vêtements et mode"],
  ["la jupe", "skirt", "Vêtements et mode"], ["la chemise", "shirt", "Vêtements et mode"], ["le blouson", "jacket", "Vêtements et mode"],
  ["la robe", "dress", "Vêtements et mode"], ["les chaussures", "shoes", "Vêtements et mode"], ["le chapeau", "hat", "Vêtements et mode"],
  ["le tatouage", "tattoo", "Vêtements et mode"], ["branché", "trendy", "Vêtements et mode"], ["le style vestimentaire", "clothing style", "Vêtements et mode"],
  ["une enquête", "survey", "Vêtements et mode"], ["l'appartenance", "belonging", "Vêtements et mode"],
  // useful verbs
  ["s'occuper de", "to take care of", "Verbes utiles"], ["prendre soin de", "to take care of", "Verbes utiles"], ["allumer", "to turn on", "Verbes utiles"],
  ["éteindre", "to turn off", "Verbes utiles"], ["sonner", "to ring", "Verbes utiles"], ["accompagner", "to give someone a ride", "Verbes utiles"],
  ["aller chercher", "to go pick up", "Verbes utiles"], ["offrir", "to give (a gift)", "Verbes utiles"], ["proposer", "to suggest, to offer", "Verbes utiles"],
  ["découvrir", "to discover", "Verbes utiles"], ["appartenir", "to belong", "Verbes utiles"], ["s'intéresser à", "to be interested in", "Verbes utiles"],
  ["s'agir de", "to be about", "Verbes utiles"], ["se méfier", "to be suspicious", "Verbes utiles"], ["se demander", "to wonder", "Verbes utiles"],
  ["jurer", "to swear", "Verbes utiles"], ["encourager", "to encourage", "Verbes utiles"], ["reconnaître", "to recognize", "Verbes utiles"],
  ["empêcher", "to prevent", "Verbes utiles"], ["se tromper", "to make a mistake", "Verbes utiles"], ["tromper", "to cheat on", "Verbes utiles"],
  ["se passer", "to happen", "Verbes utiles"], ["corriger", "to correct", "Verbes utiles"], ["conduire", "to drive", "Verbes utiles"],
  ["pleurer", "to cry", "Verbes utiles"], ["chasser", "to hunt", "Verbes utiles"], ["vider", "to empty", "Verbes utiles"],
  // expressions
  ["prends soin de toi", "take care of yourself", "Expressions"], ["un coup de main", "a hand (help)", "Expressions"],
  ["un coup de fil", "a phone call", "Expressions"], ["un coup de foudre", "love at first sight", "Expressions"],
  ["pas du tout", "not at all", "Expressions"], ["pas de souci", "no worries", "Expressions"], ["c'est hors de question", "it's out of the question", "Expressions"],
  ["ça m'étonnerait", "I doubt it", "Expressions"], ["je croise les doigts", "I'm crossing my fingers", "Expressions"],
  ["par hasard", "by chance", "Expressions"], ["exprès", "on purpose", "Expressions"], ["prendre un verre", "to have a drink", "Expressions"],
  ["prendre un rhume", "to catch a cold", "Expressions"], ["avoir du feu", "to have a light", "Expressions"], ["être nul en", "to be bad at", "Expressions"],
  ["je ne peux pas m'empêcher de", "I can't help (doing)", "Expressions"], ["ne t'inquiète pas", "don't worry", "Expressions"],
  ["vachement", "really, very (familiar)", "Expressions"], ["dès que possible", "as soon as possible", "Expressions"], ["à bientôt", "see you soon", "Expressions"],
  ["avoir faim", "to be hungry", "Expressions"], ["avoir soif", "to be thirsty", "Expressions"], ["avoir chaud", "to be hot", "Expressions"],
  ["avoir froid", "to be cold", "Expressions"], ["avoir mal à la tête", "to have a headache", "Expressions"], ["faire de la randonnée", "to go hiking", "Expressions"],
];

// Reference sheets. `topics` links a sheet to the cloze topics it explains.
DATA.fiches = [
  {
    id: "present", title: "Le présent", topics: ["présent", "examen"],
    html: `<p>Infinitive minus ending = the base. Add the endings for its group.</p>
<table><tr><th></th><th>-er (parler)</th><th>-ir (finir)</th><th>-re (vendre)</th></tr>
<tr><td>je</td><td>parl<b>e</b></td><td>fin<b>is</b></td><td>vend<b>s</b></td></tr>
<tr><td>tu</td><td>parl<b>es</b></td><td>fin<b>is</b></td><td>vend<b>s</b></td></tr>
<tr><td>il / elle</td><td>parl<b>e</b></td><td>fin<b>it</b></td><td>vend</td></tr>
<tr><td>nous</td><td>parl<b>ons</b></td><td>fin<b>issons</b></td><td>vend<b>ons</b></td></tr>
<tr><td>vous</td><td>parl<b>ez</b></td><td>fin<b>issez</b></td><td>vend<b>ez</b></td></tr>
<tr><td>ils / elles</td><td>parl<b>ent</b></td><td>fin<b>issent</b></td><td>vend<b>ent</b></td></tr></table>
<p>Spelling quirks: mang<b>e</b>ons, commen<b>ç</b>ons, j'ach<b>è</b>te, je préf<b>è</b>re, j'appe<b>ll</b>e. Verbs in -yer: je pa<b>i</b>e / je pa<b>y</b>e.</p>
<p>Negation wraps the conjugated verb: <i>je <b>ne</b> parle <b>pas</b></i>, <i>elle <b>n'</b>a <b>pas</b></i>. Reflexive pronoun stays inside: <i>ils <b>ne</b> se douchent <b>pas</b></i>.</p>
<p>Use the Conjugation tab's verb table for all the irregular verbs (être, avoir, aller, faire, prendre…).</p>`,
  },
  {
    id: "pc", title: "Le passé composé", topics: ["passé composé"],
    html: `<p><b>sujet + avoir/être (présent) + participe passé</b>: j'ai parlé, je suis allé(e).</p>
<p>Participle: -er → <b>é</b>, -ir → <b>i</b>, -re → <b>u</b>. Irregular: eu, été, fait, pris, mis, dit, écrit, lu, vu, bu, pu, voulu, dû, su, connu, cru, vécu, plu, ouvert, offert, reçu, né, mort.</p>
<p><b>Être</b> for the 17 movement verbs (DR &amp; MRS VANDERTRAMP: devenir, revenir, monter, rester, sortir, passer, venir, aller, naître, descendre, entrer, retourner, tomber, rentrer, arriver, mourir, partir) and <b>all reflexive verbs</b>.</p>
<p>With être, the participle agrees with the subject: elle est allé<b>e</b>, ils sont arrivé<b>s</b>, elles se sont levé<b>es</b>.</p>
<p>Negation: je <b>ne</b> suis <b>pas</b> venu · il <b>n'</b>a <b>pas</b> mangé.</p>`,
  },
  {
    id: "proche", title: "Futur proche et passé récent", topics: ["venir de / aller"],
    html: `<p><b>Futur proche</b> = aller (présent) + infinitif: <i>je vais manger</i>. Negation: <i>je ne vais pas manger</i>. Reflexive: <i>je vais me lever</i>.</p>
<p><b>Passé récent</b> = venir (présent) + de / d' + infinitif: <i>je viens de parler</i>, <i>je viens d'écouter</i>, <i>je viens de me réveiller</i>.</p>
<p>Only aller/venir change; the second verb stays in the infinitive.</p>`,
  },
  {
    id: "imp", title: "L'imparfait", topics: ["imparfait"],
    html: `<p>Stem = <b>nous</b> form of the présent minus -ons (nous prenons → pren-). Endings: <b>-ais, -ais, -ait, -ions, -iez, -aient</b>.</p>
<p>Only exception: être → <b>ét-</b> (j'étais). Il faut → il fallait.</p>
<p>Use it for habits and descriptions in the past: <i>Quand j'étais petit, je jouais au football.</i></p>`,
  },
  {
    id: "fut", title: "Futur simple et conditionnel", topics: ["futur simple", "conditionnel"],
    html: `<p><b>Futur simple</b> = stem + <b>-ai, -as, -a, -ons, -ez, -ont</b>.<br><b>Conditionnel</b> = same stem + imparfait endings <b>-ais, -ais, -ait, -ions, -iez, -aient</b>.</p>
<p>Stem: -er/-ir → infinitive (manger-, finir-); -re → drop e (prendr-, mettr-, dir-).</p>
<p>Irregular stems: être <b>ser</b> · avoir <b>aur</b> · aller <b>ir</b> · venir <b>viendr</b> · faire <b>fer</b> · voir <b>verr</b> · envoyer <b>enverr</b> · pouvoir <b>pourr</b> · vouloir <b>voudr</b> · devoir <b>devr</b> · savoir <b>saur</b> · falloir <b>faudr</b> · pleuvoir <b>pleuvr</b>.</p>
<p>Conditionnel = polite request (<i>je voudrais</i>, <i>pourriez-vous</i>), wish (<i>nous aimerions</i>), advice (<i>tu devrais</i>), hypothesis.</p>
<p>Watch out: j'aimerai (will) ≠ j'aimerais (would); je voudrai ≠ je voudrais.</p>`,
  },
  {
    id: "impe", title: "L'impératif", topics: ["impératif"],
    html: `<p>Three persons only, no subject: <b>tu / nous / vous</b> from the présent. <i>Prends ! Prenons ! Prenez !</i></p>
<p>-er verbs (and offrir, ouvrir) drop the <b>s</b> of the tu form: <i>Parle ! Mange ! Va !</i> but <i>Vas-y !</i></p>
<p>Irregular: être → sois, soyons, soyez · avoir → aie, ayons, ayez · savoir → sache, sachons, sachez.</p>
<p>Reflexive: <i>Repose-toi ! Reposons-nous ! Reposez-vous !</i> Negative: <i>Ne te repose pas ! Ne dors pas !</i></p>`,
  },
  {
    id: "questions", title: "Poser une question", topics: ["questions"],
    html: `<table><tr><th>Register</th><th>Yes / no</th><th>With a question word</th></tr>
<tr><td>Formel (inversion)</td><td>Parlez-vous français ?</td><td>Où habitez-vous ?</td></tr>
<tr><td>Standard (est-ce que)</td><td>Est-ce que vous parlez français ?</td><td>Où est-ce que vous habitez ?</td></tr>
<tr><td>Familier (intonation)</td><td>Vous parlez français ?</td><td>Vous habitez où ?</td></tr></table>
<p>Inversion with il/elle/on + verb ending in a vowel adds <b>-t-</b>: <i>A-t-il… ? Commence-t-elle… ? Y a-t-il… ?</i> Je peux → <b>Puis-je</b>.</p>
<p><b>Que</b> at the start (Que faites-vous ? / Qu'est-ce que…), <b>quoi</b> at the end (Vous faites quoi ?). Pourquoi always goes first.</p>
<p>Quel agrees with the noun: quel âge, quelle adresse, quels loisirs, quelles activités.</p>`,
  },
  {
    id: "relatifs", title: "Les pronoms relatifs", topics: ["relatifs"],
    html: `<p><b>qui</b> replaces the subject → followed by a verb: <i>mon voisin <b>qui</b> est mécanicien</i>.</p>
<p><b>que / qu'</b> replaces the direct object → followed by a subject: <i>la maison <b>que</b> vous venez d'acheter</i>.</p>
<p><b>où</b> replaces a place or time: <i>la ville <b>où</b> je suis né</i>. <b>dont</b> replaces "de + noun": <i>le film <b>dont</b> je parle</i>.</p>
<p>Test: after the blank, is there a verb (qui) or a subject (que)?</p>`,
  },
  {
    id: "demo", title: "Les démonstratifs", topics: ["démonstratifs"],
    html: `<table><tr><th></th><th>adjective (this / these)</th><th>pronoun (the one / those)</th></tr>
<tr><td>masc. sing.</td><td>ce livre · cet homme</td><td>celui</td></tr>
<tr><td>fém. sing.</td><td>cette chemise</td><td>celle</td></tr>
<tr><td>masc. plur.</td><td>ces livres</td><td>ceux</td></tr>
<tr><td>fém. plur.</td><td>ces lunettes</td><td>celles</td></tr></table>
<p>The pronoun is followed by qui/que, de, or -ci / -là: <i>celui qui est italien</i>, <i>celle de Nina</i>, <i>ceux-ci</i> (these ones), <i>celles-là</i> (those ones).</p>`,
  },
  {
    id: "poss", title: "Les possessifs", topics: ["possessifs"],
    html: `<table><tr><th></th><th>masc.</th><th>fém.</th><th>plur.</th></tr>
<tr><td>je</td><td>mon</td><td>ma</td><td>mes</td></tr><tr><td>tu</td><td>ton</td><td>ta</td><td>tes</td></tr>
<tr><td>il / elle</td><td>son</td><td>sa</td><td>ses</td></tr><tr><td>nous</td><td>notre</td><td>notre</td><td>nos</td></tr>
<tr><td>vous</td><td>votre</td><td>votre</td><td>vos</td></tr><tr><td>ils / elles</td><td>leur</td><td>leur</td><td>leurs</td></tr></table>
<p>Agrees with the <b>thing owned</b>, not the owner: <i>il aime <b>sa</b> voiture</i>. Feminine before a vowel uses mon/ton/son: <i>mon amie, mon école</i>.</p>`,
  },
  {
    id: "articles", title: "Les articles", topics: ["articles"],
    html: `<p>Définis: le, la, l', les (likes, general things: <i>j'aime <b>le</b> café</i>). Indéfinis: un, une, des.</p>
<p>Partitifs (an unspecified amount): <b>du</b>, <b>de la</b>, <b>de l'</b>, <b>des</b> (<i>je mange du poisson</i>, <i>il faut de la farine</i>). Faire + activity: <i>faire du sport, de la natation</i>.</p>
<p>After a negation or quantity → <b>de / d'</b>: <i>je n'ai pas de frères</i>, <i>beaucoup d'eau</i>, <i>un peu de sel</i>.</p>
<p>Contractions: à + le = <b>au</b>, à + les = <b>aux</b>, de + le = <b>du</b>, de + les = <b>des</b>. (à la, à l', de la, de l' don't change.)</p>`,
  },
  {
    id: "prep", title: "Prépositions et lieux", topics: ["prépositions"],
    html: `<p><b>à</b> + city: à Paris, à Téhéran. <b>en</b> + feminine country or one starting with a vowel: en France, en Iran, en Italie. <b>au</b> + masculine country: au Canada, au Brésil, au Portugal. <b>aux</b> + plural: aux États-Unis.</p>
<p>Coming from: de/d' + feminine (d'Iran, de France), du + masculine (du Canada), des + plural (des États-Unis).</p>
<p><b>chez</b> + person: chez moi, chez mon ami, chez le boulanger (= à la boulangerie).</p>`,
  },
  {
    id: "tout", title: "Tout, toute, tous, toutes", topics: ["tout"],
    html: `<p>Agrees with the noun: <b>tout</b> le monde, <b>toute</b> la journée, <b>tous</b> les jours, <b>toutes</b> les fenêtres.</p>
<p>Fixed: <i>pas du tout</i> (not at all), <i>tout le temps</i> (all the time).</p>`,
  },
  {
    id: "toniques", title: "Les pronoms toniques", topics: ["pronoms toniques"],
    html: `<p>moi, toi, lui, elle, nous, vous, eux, elles.</p>
<p>After prepositions (avec, pour, sans, chez, devant, après…: <i>avec toi, chez moi, pour eux</i>), for emphasis (<i>Moi, je…</i>; <i>Lui, il…</i>), and after c'est (<i>c'est elle qui…</i>).</p>`,
  },
  {
    id: "temps", title: "Expressions du temps", topics: ["expressions du temps"],
    html: `<p><b>depuis</b> + présent = action started in the past and still going: <i>J'étudie le français depuis 2 ans</i>.</p>
<p><b>il y a</b> + passé composé = ago: <i>Je suis arrivé il y a deux ans</i>.</p>
<p><b>pendant</b> = for a finished duration: <i>J'ai habité à Paris pendant trois ans</i>.</p>
<p><b>avant de</b> + infinitif: <i>avant de partir</i>. Adverbs from adjectives: lent → lente → lente<b>ment</b>; gentil → gentiment.</p>`,
  },
  {
    id: "adj", title: "Les adjectifs", topics: ["adjectifs"],
    html: `<p>Feminine usually + e (petit → petite); -ien → -ienne; -eux → -euse; -if → -ive; sec → sèche; nul → nulle.</p>
<p>Most adjectives go <b>after</b> the noun. These short ones go <b>before</b>: beau, joli, nouveau, jeune, vieux, petit, grand, gros, bon, mauvais (plus dernier, prochain).</p>
<p>Before a masculine noun starting with a vowel: <b>bel</b> homme, <b>nouvel</b> appartement, <b>vieil</b> ami.</p>`,
  },
];

// One-line rule shown in the feedback panel after a mistake, keyed by fiche id.
DATA.short = {
  present: "-er: e, es, e, ons, ez, ent · -ir: is, is, it, issons, issez, issent · -re: s, s, –, ons, ez, ent",
  pc: "avoir / être (présent) + past participle. Être for movement verbs and all reflexives, and then the participle agrees with the subject.",
  proche: "Near future = aller + infinitive (je vais manger). Recent past = venir de + infinitive (je viens de manger).",
  imp: "Stem = nous form minus -ons, then ais, ais, ait, ions, iez, aient. Only exception: être → ét-.",
  fut: "Futur: stem + ai, as, a, ons, ez, ont. Conditionnel: same stem + ais, ais, ait, ions, iez, aient.",
  impe: "Use the tu / nous / vous forms of the présent with no subject. -er verbs drop the s in the tu form (Parle !).",
  questions: "Formal: inversion (Parlez-vous ?). Standard: est-ce que. Familiar: intonation (Vous parlez ?).",
  relatifs: "qui + verb (it replaces the subject) · que + subject (replaces the object) · où = place or time · dont = de + noun",
  demo: "celui (m) · celle (f) · ceux (m pl) · celles (f pl), followed by qui / que / de / -ci / -là",
  poss: "The possessive agrees with the thing owned, not the owner: il aime sa voiture.",
  articles: "du / de la / de l' for an amount · after a negation or a quantity, use de: pas de, beaucoup de",
  prep: "à + city · en + feminine country or vowel · au + masculine country · aux + plural country",
  tout: "Agrees with the noun: tout le, toute la, tous les, toutes les",
  toniques: "moi, toi, lui, elle, nous, vous, eux, elles: after prepositions (avec toi) and for emphasis (Moi, je…)",
  temps: "depuis + présent = still going · il y a + past = ago · pendant = a finished duration",
  adj: "Feminine usually adds -e. beau, joli, nouveau, jeune, vieux, petit, grand, bon go before the noun.",
};

// The course path for the Learn section. Each lesson teaches a fiche, then quizzes its items.
DATA.units = [
  { title: "Foundations", lessons: [
    { id: "present", title: "The present tense", fiche: "present", tenses: ["pres"], topics: ["présent", "examen"], models: ["parler", "finir", "prendre"] },
    { id: "questions", title: "Asking questions", fiche: "questions", topics: ["questions"] },
    { id: "articles", title: "Articles and partitives", fiche: "articles", topics: ["articles"] },
    { id: "prep", title: "Prepositions with places", fiche: "prep", topics: ["prépositions"] },
  ]},
  { title: "Describing people and things", lessons: [
    { id: "poss", title: "Possessives (mon, ma, mes)", fiche: "poss", topics: ["possessifs"] },
    { id: "demo", title: "Demonstratives (ce, celui)", fiche: "demo", topics: ["démonstratifs"] },
    { id: "adj", title: "Adjectives", fiche: "adj", topics: ["adjectifs"] },
    { id: "toniques", title: "Stressed pronouns (moi, toi)", fiche: "toniques", topics: ["pronoms toniques"] },
    { id: "tout", title: "Tout, toute, tous, toutes", fiche: "tout", topics: ["tout"] },
  ]},
  { title: "Talking about time", lessons: [
    { id: "proche", title: "Near future and recent past", fiche: "proche", tenses: ["fp", "pr"], topics: ["venir de / aller"], models: ["manger", "se lever"] },
    { id: "impe", title: "Giving instructions (impératif)", fiche: "impe", tenses: ["impe"], topics: ["impératif"], models: ["parler", "être", "se reposer"] },
    { id: "pc", title: "The passé composé", fiche: "pc", tenses: ["pc"], topics: ["passé composé"], models: ["parler", "aller", "se lever"] },
    { id: "imp", title: "The imparfait", fiche: "imp", tenses: ["imp"], topics: ["imparfait"], models: ["parler", "être", "manger"] },
    { id: "fut", title: "Futur simple and conditionnel", fiche: "fut", tenses: ["fut", "cond"], topics: ["futur simple", "conditionnel"], models: ["parler", "être", "aller"] },
    { id: "temps", title: "Depuis, il y a, pendant", fiche: "temps", topics: ["expressions du temps"] },
  ]},
  { title: "Linking ideas", lessons: [
    { id: "relatifs", title: "Relative pronouns (qui, que, où)", fiche: "relatifs", topics: ["relatifs"] },
  ]},
];
