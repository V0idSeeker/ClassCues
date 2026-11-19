// The guide's text in French. Page ids and the number of points must match en.ts.
import type { CodexText } from '../../ui/help/codexData';

export const codexFr: CodexText = {
  categories: {
    basics: 'Les bases',
    teaching: 'Enseigner',
    students: 'Vos élèves',
    scores: 'Interro et scores',
    courses: 'Leçons et cours',
    ai: 'IA et réglages',
  },
  pages: {
    'goal': {
      title: 'Le principe du jeu',
      intro: 'Vous êtes le professeur d’une classe de dix élèves joués par une IA. Ils ne savent rien du sujet du jour, sauf ce que vous leur apprenez. À la fin, ils passent une interro avec leurs seules notes : leurs scores montrent si vous avez bien enseigné.',
      points: [
        'Le vrai but, c’est que vous appreniez le sujet. Pour répondre à un élève qui demande « pourquoi ? » ou « et si ? », il faut l’avoir compris vous-même.',
        'Les élèves sont différents : certains écoutent bien, d’autres décrochent, d’autres arrivent avec des idées fausses à corriger.',
        'Il n’y a pas une seule bonne façon d’enseigner. Expliquez, donnez des exemples, posez des questions, servez-vous du tableau.',
      ],
    },
    'lesson': {
      title: 'Une leçon, étape par étape',
      intro: 'Chaque leçon suit le même chemin : choisir une leçon, l’enseigner, sonner la cloche, lire le bulletin.',
      points: [
        'Choisir : sur l’écran des leçons, appuyez sur Enseigner à côté d’une leçon. Dix élèves sont tirés parmi trente.',
        'Préparer : lisez les objectifs et les notes de préparation, et voyez quelles idées fausses les élèves peuvent apporter.',
        'Enseigner : parlez, écrivez au tableau, répondez aux questions, vérifiez la compréhension.',
        'Sonner la cloche : les élèves passent une interro de six questions avec leurs notes.',
        'Bulletin : voyez la moyenne de la classe, chaque réponse et trois conseils pour la prochaine fois. Puis essayez de battre votre record.',
      ],
    },
    'prepare': {
      title: 'Se préparer avant d’enseigner',
      intro: 'Avant chaque leçon, un écran de préparation montre ce que vous allez enseigner : les objectifs, les notes de préparation et les idées fausses avec lesquelles certains élèves arriveront. Lisez-le d’abord : on n’enseigne pas ce qu’on n’a pas compris.',
      points: [
        'Les questions de l’interro restent cachées. Chacune évalue un des objectifs.',
        'Prévoyez comment corriger chaque idée fausse, pas seulement comment expliquer la bonne.',
        'Pendant la leçon, « Notes de cours » dans le menu ☰ rouvre les mêmes notes.',
        'Cochez « Ne plus afficher cet écran » pour aller directement en classe. Réactivez-le dans les Réglages.',
        'Quand vos classes ratent souvent un objectif d’une leçon, il apparaît dans « Souvent manqués » sur l’écran des leçons et sur l’écran de préparation.',
      ],
    },
    'turns': {
      title: 'Les tours et l’horloge',
      intro: 'Une leçon dure 20 tours ou 15 vraies minutes, selon ce qui arrive en premier. L’horloge de la barre du haut l’affiche comme un cours de 45 minutes.',
      points: [
        'Un tour, c’est un appui sur « Dire » (ou Entrée), ou un « Écrire au tableau ».',
        'Taper directement sur le tableau compte comme un tour quand vous cliquez ailleurs.',
        'Changer de tableau, interroger un élève et poser une question à la classe ne coûtent pas de tour.',
        'Quand les tours ou le temps sont écoulés, la cloche sonne toute seule.',
        'Avec une offre IA gratuite limitée par jour, la cloche sonne aussi plus tôt s’il ne reste que les requêtes nécessaires à l’interro.',
      ],
    },
    'bell': {
      title: 'Sonner la cloche',
      intro: 'Appuyez sur « Sonner la cloche » quand vous avez enseigné tout ce que vous vouliez. Utiliser les 20 tours ne rapporte rien de plus.',
      points: [
        'Avant de sonner, regardez le panneau des objectifs : un objectif à 0/10 veut dire que personne ne l’a dans ses notes, donc que personne ne peut répondre à sa question.',
        'Les mains encore levées à la sonnerie sont signalées dans le bulletin.',
        'L’interro prend un peu de temps : l’IA répond pour chaque élève, puis corrige les réponses écrites.',
      ],
    },
    'talking': {
      title: 'Parler à la classe',
      intro: 'Tapez ce que vous diriez à voix haute et appuyez sur Entrée (ou « Dire »). Tous les élèves l’entendent et certains prennent des notes.',
      points: [
        'Les élèves n’apprennent que ce que vous dites, écrivez ou dessinez. Si vous ne parlez jamais d’une chose, personne ne la sait.',
        'Si vous dites quelque chose de faux, les élèves le notent tel quel et s’en servent à l’interro.',
        'Des phrases courtes et claires valent mieux qu’un long discours. Les exemples aident les élèves en difficulté.',
        'Maj+Entrée passe à la ligne sans envoyer.',
      ],
    },
    'asking': {
      title: 'Poser des questions',
      intro: 'Les questions vous montrent ce que les élèves ont vraiment compris, et elles tiennent la classe éveillée.',
      points: [
        'Finissez une phrase par un point d’interrogation et un élève répond à voix haute. Un élève qui lève la main passe en premier ; sinon, quelqu’un est choisi.',
        'Mettez le prénom d’un élève dans votre phrase (« Maya, pourquoi ça marche ? ») et c’est lui qui répond, personne d’autre.',
        '« Demander à la classe » sans rien taper demande si quelqu’un a une question.',
        'Après la réponse d’un élève, un camarade peut lever la main pour approuver, contester ou compléter.',
        'Confirmez ou corrigez toujours une réponse à voix haute. Une réponse que vous ignorez peut finir dans les notes des autres comme ouï-dire.',
      ],
    },
    'calling': {
      title: 'Mains levées et interroger un élève',
      intro: 'Les élèves lèvent la main quand ils veulent demander ou dire quelque chose. Une main levée, c’est un bras qui s’agite dans la classe et une bulle ✋.',
      points: [
        'Cliquez sur le bureau d’un élève qui lève la main pour entendre ce qu’il veut dire.',
        'Le bouton ✋ à côté de l’élève sélectionné indique combien de mains sont levées et passe à la suivante.',
        '« Interroger » un élève : s’il lève la main, il parle ; si vous avez tapé une question, il y répond ; si vous n’avez rien tapé, il est invité à poser une question.',
        'Les élèves posent de vraies questions sur la leçon : pourquoi, et si, où la règle cesse de marcher. Bien y répondre, c’est le cœur du jeu.',
        '🔊 sous la zone de saisie répète ce qu’a dit l’élève sélectionné.',
      ],
    },
    'board': {
      title: 'Le tableau',
      intro: 'Les élèves recopient ce que vous écrivez au tableau, souvent plus fidèlement que ce que vous dites. Écrivez-y les points clés.',
      points: [
        'Cliquez sur le tableau et tapez, ou tapez dans la zone du dessous et appuyez sur « Écrire au tableau ».',
        'Sélectionnez des mots au tableau pour les effacer ou les retaper. « Effacer la sélection » fait la même chose avec un bouton.',
        '« Tout effacer » vide le tableau ; « Annuler l’effacement » le fait revenir.',
        'Effacer empêche seulement les élèves de recopier à partir de maintenant. Les notes déjà prises restent dans leurs cahiers.',
        '« Grand tableau » affiche un tableau plus grand avec les visages des élèves en dessous.',
      ],
    },
    'speaking': {
      title: 'Parler au lieu de taper',
      intro: 'Appuyez sur 🎤 à côté de la zone de saisie et parlez. Vos mots s’affichent dans la zone au fur et à mesure.',
      points: [
        'Rien n’est envoyé tout seul. Relisez ce qui a été entendu, corrigez les erreurs, puis appuyez sur Dire ou Entrée.',
        'Appuyez sur ■ Stop, ou commencez à taper, pour arrêter l’écoute.',
        'Fonctionne dans Chrome, Edge et Safari. Firefox n’a pas de reconnaissance vocale, le bouton n’y apparaît donc pas.',
        'La première fois, le navigateur demande l’accès au micro. Si vous avez refusé, autorisez-le avec l’icône à gauche de la barre d’adresse.',
        'Dans Chrome et Edge, le son est envoyé à l’éditeur du navigateur pour être transformé en texte.',
      ],
    },
    'slides': {
      title: 'Plusieurs tableaux, comme des diapos',
      intro: 'Quand un tableau est plein, prenez-en un nouveau au lieu d’effacer. Chaque tableau garde son texte.',
      points: [
        '« Nouveau tableau » ajoute un tableau vierge (jusqu’à 12). ◀ et ▶ passent d’un tableau à l’autre.',
        'La classe ne voit que le tableau affiché.',
        'Afficher un tableau pour la première fois compte comme du nouveau contenu. Revenir à un tableau déjà vu ne coûte rien et les élèves ne le recopient pas deux fois.',
        'Changer de tableau ne coûte pas de tour.',
      ],
    },
    'pictures': {
      title: 'Dessins et images',
      intro: 'Avec un modèle d’IA qui sait lire les images, vous pouvez dessiner à la craie au tableau ou ajouter une image, et les élèves la voient.',
      points: [
        'Les modèles Gemini savent lire les images. OpenRouter indique lesquels de ses modèles le peuvent. Pour un modèle local qui le peut, cochez « Mon modèle sait lire les images » dans les Réglages.',
        'Avec tout autre modèle, les outils de dessin sont masqués.',
        '« Dessiner » transforme la souris ou le doigt en craie, en quatre couleurs. Appuyez sur « Arrêter de dessiner » pour taper à nouveau.',
        'Une nouvelle image compte comme un tour. Vous pouvez ajouter quelques mots pour dire ce qu’elle montre.',
      ],
    },
    'students': {
      title: 'Qui sont vos élèves',
      intro: 'Chaque classe compte dix élèves. Six d’entre eux sont chacun d’un des types ci-dessous ; les quatre autres sont des élèves ordinaires avec leurs propres habitudes.',
      points: [
        'Motivé : écoute bien, pose beaucoup de questions, veut des définitions exactes.',
        'Discret : comprend beaucoup mais ne parle jamais sauf si vous l’interrogez. Le silence ne veut pas dire qu’il a compris.',
        'Clown de la classe : vite distrait, pose ses questions en blaguant, mais la question est sérieuse.',
        'Sceptique : demande « pourquoi ? » et repère quand quelque chose ne colle pas.',
        'Porteur d’idées fausses : arrive sûr de deux idées fausses sur le sujet.',
        'En difficulté : a besoin de mots simples, d’une idée à la fois et d’exemples.',
      ],
    },
    'moods': {
      title: 'Humeurs et bulles au-dessus des têtes',
      intro: 'Chaque élève montre ce qu’il ressent par son visage et une bulle à côté de sa tête. Une main levée passe toujours avant l’humeur. Les élèves timides cachent qu’ils sont perdus : ils ont l’air calmes jusqu’à ce que vous posiez une question à la classe ou que vous leur parliez.',
      points: [
        'Les humeurs se gardent d’un tour à l’autre ; elles ne repartent pas de zéro.',
        'Un élève qui s’ennuie prend moins de notes : l’ennui coûte des points à l’interro.',
        'Les exemples, les questions et le fait de s’adresser à un élève améliorent son humeur. Un long monologue sans échange ennuie les moins attentifs.',
      ],
    },
    'class-mood': {
      title: 'L’ambiance de la classe',
      intro: 'La barre du haut montre comment se sent la classe dans son ensemble. Les humeurs se propagent : quand beaucoup d’élèves s’ennuient ou sont perdus, les autres suivent.',
      points: [
        'Trois de vos tours d’affilée ou plus sans qu’un élève parle, c’est un monologue. Les élèves peu attentifs s’ennuient.',
        'Pour une classe agitée : posez une question, interrogez quelqu’un ou donnez un exemple.',
        'Pour une classe perdue : ralentissez, revenez au dernier point clair et vérifiez avec une question.',
      ],
    },
    'notebooks': {
      title: 'Les cahiers',
      intro: 'Cliquez sur un élève dans la classe, puis ouvrez Cahier (à côté de Discussion, sous la zone de saisie). C’est tout ce qu’il aura pour l’interro. Un point sur Cahier signale que des élèves ont écrit du nouveau depuis votre dernier coup d’œil.',
      points: [
        'Les élèves prennent des notes avec leurs propres mots. Les plus attentifs retiennent presque tout ; les autres en ratent une partie.',
        'Orange : une note faussée par une idée fausse. Elle ne compte pas pour les objectifs.',
        'Rouge : une idée fausse que l’élève a encore. Corrigez-la clairement, sinon il répondra à l’interro avec.',
        'Gris : un souvenir d’une leçon précédente.',
        'Une note qui commence par un prénom (« Tom a dit : ... ») est du ouï-dire : l’affirmation d’un camarade que personne n’a confirmée.',
      ],
    },
    'goals': {
      title: 'Les objectifs de la leçon',
      intro: 'Le compteur d’objectifs en haut (« Objectifs 2/5 ») indique combien d’objectifs au moins un élève a dans ses notes. Ouvrez-le pour voir chaque objectif avec le nombre d’élèves qui ont une note juste dessus.',
      points: [
        'Chaque marque verte est un élève. 0/10 veut dire que vous ne l’avez pas encore enseigné, ou que personne ne l’a retenu.',
        'Chaque question de l’interro évalue un objectif. Un objectif sans notes, c’est une question perdue.',
        'Les notes faussées et le ouï-dire ne comptent pas.',
      ],
    },
    'wrong-beliefs': {
      title: 'Les idées fausses',
      intro: 'Certains élèves commencent la leçon en croyant quelque chose de faux sur le sujet, comme « le signe = veut dire égal, comme en maths ». Elles viennent de la leçon elle-même.',
      points: [
        'Le porteur d’idées fausses en a deux, l’élève en difficulté une, et deux autres élèves une chacun.',
        'Une idée fausse reste tant que vous ne l’avez pas clairement corrigée. Les élèves sûrs d’eux ont besoin que vous nommiez l’idée fausse et disiez pourquoi elle est fausse ; entendre la bonne réponse ne leur suffit pas. Elle fausse aussi les notes qui s’y rapportent.',
        'Les élèves qui y croient encore à la sonnerie répondent à l’interro avec. Le bulletin les liste.',
        'Dites quelle est l’idée fausse et pourquoi elle est fausse, pas seulement la bonne idée.',
      ],
    },
    'difficulty': {
      title: 'Facile, Normal, Difficile, Inspection',
      intro: 'Choisissez la difficulté de votre classe dans les Réglages. Normal, c’est le jeu tel qu’il a été conçu.',
      points: [
        'Facile : les élèves sont plus attentifs, et seul le porteur d’idées fausses en apporte.',
        'Difficile : les élèves sont moins attentifs. Tous sauf l’élève motivé apportent une idée fausse, le porteur trois.',
        'Inspection : comme Difficile, et une bonne réponse écrite que les notes de l’élève ne justifient pas ne rapporte aucun point.',
        'Les classes plus dures comptent davantage pour votre grade.',
      ],
    },
    'hearsay': {
      title: 'Le ouï-dire',
      intro: 'Quand un élève dit quelque chose et que vous passez à la suite sans confirmer ni corriger, quelques camarades distraits peuvent quand même le noter, sous la forme « Prénom a dit : ... ».',
      points: [
        'Le ouï-dire ne compte pas pour les objectifs, et si l’affirmation était fausse, elle peut embrouiller les élèves.',
        'Le bulletin vous prévient quand c’est arrivé.',
        'Évitez-le en réagissant à chaque réponse : « Oui, exactement » ou « Pas tout à fait, parce que... ».',
      ],
    },
    'memory': {
      title: 'La mémoire d’une leçon à l’autre',
      intro: 'Les élèves se souviennent. Après une interro, chaque élève garde jusqu’à huit notes de cette leçon, justes ou fausses, pour ses trois leçons suivantes.',
      points: [
        'Les notes retenues apparaissent en gris dans le cahier. Les élèves peuvent s’en servir pour parler et à l’interro.',
        'Un élève absent d’un cours ne s’en souvient de rien.',
        'Refaire la même leçon repart de zéro : une nouvelle partie mesure toujours l’enseignement du jour.',
        'Vos erreurs trouvées par la vérification sont retenues aussi. Lors des leçons suivantes, les élèves qui les ont notées commencent en y croyant (en rouge dans le cahier) jusqu’à ce que vous les corrigiez, trois au plus par élève.',
        'Les Réglages proposent « Faire oublier les leçons précédentes ».',
      ],
    },
    'voices': {
      title: 'Les voix',
      intro: 'Les élèves lisent leurs répliques à voix haute avec les voix intégrées à votre navigateur, et leur bouche bouge pendant qu’ils parlent.',
      points: [
        'Edge a les voix les plus naturelles. Chrome et Firefox marchent aussi.',
        'Activez ou coupez les voix avec « Voix » dans le menu ☰ ou dans les Réglages. Le texte reste toujours affiché.',
      ],
    },
    'quiz': {
      title: 'L’interro',
      intro: 'Chaque élève répond à six questions avec uniquement son cahier, ses idées fausses et ce dont il se souvient des leçons précédentes. L’IA ne peut pas utiliser ce qu’elle sait du sujet.',
      points: [
        'QCM : un élève sans note sur cet objectif répond au hasard.',
        'Les réponses écrites sont corrigées par rapport à une réponse modèle, avec la même exigence pour tous.',
        'Une bonne réponse écrite que les notes de l’élève ne justifient pas rapporte au plus la moitié des points.',
        'La seule façon d’augmenter les scores, c’est donc d’enseigner.',
      ],
    },
    'report': {
      title: 'Le bulletin',
      intro: 'Pendant que la classe fait l’interro, vous répondez de mémoire à trois de ses questions. Ensuite vous voyez comment la classe s’en est sortie, et pourquoi, et comment vous vous en êtes sorti vous-même.',
      points: [
        'La moyenne de la classe, les points que coûtent vos erreurs et la note de la leçon qui en résulte ; et s’il s’agit de votre première fois, d’un nouveau record ou de votre record actuel.',
        'Trois conseils : objectifs que personne n’avait, questions ratées par la plupart, idées fausses restantes, mains encore levées.',
        'Le tableau des objectifs : combien d’élèves avaient chaque objectif dans leurs notes, et leur moyenne aux questions correspondantes.',
        '« Votre cours, vérifié » : tout ce que vous avez dit ou écrit de faux.',
        '« Avec ses propres mots » : un élève vous réexplique la leçon.',
        'Ouvrez un élève pour voir chaque réponse, sa note et pourquoi elle a perdu des points.',
      ],
    },
    'fact-check': {
      title: 'Votre cours, vérifié',
      intro: 'Après l’interro, l’IA compare tout ce que vous avez dit et écrit avec le texte de référence de la leçon. Tout ce qui est faux ou trompeur est listé avec la version juste.',
      points: [
        'C’est ainsi que vous découvrez vos propres erreurs : les élèves notent vos erreurs comme des faits.',
        'Les erreurs graves sont listées en premier. Chacune retire des points à la note de la leçon : grave −5, mineure −2, au plus −15.',
        'Seules les affirmations fausses sont listées, pas ce que vous avez oublié.',
        'La vérification est faite par une IA et peut se tromper. En cas de doute, vérifiez, et appuyez sur « Je conteste » : l’erreur ne coûte alors rien et la classe l’oublie.',
        'Elle utilise une requête IA de plus par leçon.',
      ],
    },
    'explain-back': {
      title: 'Avec ses propres mots',
      intro: 'Après l’interro, un élève vous réexplique toute la leçon, avec uniquement son cahier. Cela montre ce que votre classe a vraiment retenu.',
      points: [
        'C’est l’élève dont le score est le plus proche de la moyenne de la classe : un élève typique, pas le meilleur.',
        'Sous l’explication sont listés les objectifs absents de ses notes.',
        'Repérez les idées fausses et les trous : ils montrent ce qu’il faut mieux expliquer la prochaine fois.',
        'Cela utilise une requête IA de plus par leçon.',
      ],
    },
    'review': {
      title: 'Revoir une leçon',
      intro: '« Revoir la leçon » sur le bulletin la rejoue, tour par tour.',
      points: [
        'Un graphique sur les tours montre les objectifs couverts et l’ambiance de la classe, avec ✋ là où des mains étaient levées. Cliquez sur un tour pour y aller.',
        'La conversation est regroupée par tour, chacun avec l’état de la classe juste après.',
        'Les erreurs trouvées par la vérification sont épinglées à la réplique où vous les avez dites.',
        'Les repères « la classe décroche » et « +1 objectif » montrent où les choses ont mal ou bien tourné.',
      ],
    },
    'follow-up': {
      title: 'Les leçons de rattrapage',
      intro: 'Quand la classe a raté des objectifs ou que la vérification a trouvé des erreurs, le bulletin propose « Faire une leçon de rattrapage ».',
      points: [
        'Un objectif est raté quand personne ne l’avait dans ses notes, ou que la classe a eu moins de 50 % à ses questions.',
        'Les dix mêmes élèves reviennent. La leçon ne couvre que les objectifs ratés et leurs questions.',
        'Les élèves commencent en croyant vos erreurs et les idées fausses qu’ils avaient encore.',
        'Son score est compté à part du cours.',
      ],
    },
    'scores': {
      title: 'Scores et cours',
      intro: 'Chaque leçon terminée enregistre sa note : la moyenne de la classe moins les points de vos erreurs. Refaites une leçon pour battre votre record. Les objectifs que vous avez ratés vous-même, ou qu’aucun élève n’avait dans ses notes, reviennent à réviser sur l’écran des leçons après 1, 3 et 7 jours.',
      points: [
        'Chaque leçon affiche son meilleur score, son dernier score et le nombre de fois où vous l’avez enseignée.',
        'Le score d’un cours est la moyenne des meilleurs scores des leçons déjà enseignées (« Score du cours 70 % · 2 sur 5 enseignées »).',
        'Les scores restent dans ce navigateur. Ils ne sont pas inclus quand vous exportez des leçons.',
      ],
    },
    'challenges': {
      title: 'Les défis de leçon',
      intro: 'Chaque leçon a un défi pédagogique, affiché dans la barre du haut avec 🎯.',
      points: [
        'Par exemple : utiliser un exemple de la vie réelle, faire répondre l’élève discret, ne jamais parler trois tours de suite sans échange.',
        'Certains sont vérifiés par le jeu, d’autres par l’IA après l’interro.',
        'Le bulletin dit si vous l’avez réussi.',
      ],
    },
    'rank': {
      title: 'Grade et badges',
      intro: 'Votre grade passe de Stagiaire à Remplaçant, Professeur, Professeur confirmé puis Chef de département à mesure que vous enseignez plus de leçons avec de meilleurs scores.',
      points: [
        'Les classes plus dures comptent davantage. Chaque leçon compte pour la moyenne de ses trois dernières parties, et les leçons de rattrapage ne comptent pas.',
        'Les badges marquent des étapes : une première classe à 80 %, un cours complet, des défis réussis, une leçon sans erreur trouvée.',
        'Les deux s’affichent dans le menu principal et sur le bulletin.',
        '« Partager » sur le bulletin crée une image de votre bulletin.',
      ],
    },
    'courses': {
      title: 'Les cours intégrés',
      intro: 'Le jeu propose trois cours à enseigner, chacun avec des objectifs, des idées fausses courantes et une interro qui évalue la compréhension.',
      points: [
        'Intro to Python : variables, décisions avec if, boucles.',
        'Data Structures : listes chaînées, piles, files, arbres binaires.',
        'SQL Basics : SELECT et WHERE, jointures, comptage et regroupement.',
        'Choisissez une leçon que vous ne maîtrisez pas encore : c’est en l’enseignant que vous l’apprendrez.',
      ],
    },
    'pdf': {
      title: 'Créer des leçons à partir de PDF',
      intro: 'Transformez vos propres notes de cours, diapos ou chapitres de manuel en leçons. L’IA écrit les objectifs, les idées fausses et l’interro.',
      points: [
        'Sur l’écran des leçons, choisissez un ou plusieurs PDF (maintenez Ctrl).',
        'Découper par chapitre : l’IA trouve où commence chaque chapitre. Ou bien découper en parties égales.',
        'Une leçon contient jusqu’à 30 000 caractères. Les PDF scannés (des images de pages) ne marchent pas.',
        'Le PDF reste sur votre ordinateur ; son texte est envoyé à votre fournisseur d’IA.',
      ],
    },
    'editing': {
      title: 'Modifier une leçon',
      intro: 'Vérifiez chaque interro générée avant de l’enseigner. Appuyez sur Modifier à côté d’une leçon.',
      points: [
        'Tout peut être changé : titre, objectifs, idées fausses, et pour chaque question son type, son objectif, son énoncé, ses choix, sa bonne réponse et son barème.',
        'Ajoutez ou supprimez des questions.',
        'Rendez-la aussi exigeante que vous voulez : il faudra ensuite enseigner assez bien pour que les élèves réussissent.',
        'L’IA pose parfois une question que le chapitre ne couvre pas. Corrigez ou supprimez ces questions.',
      ],
    },
    'sharing': {
      title: 'Partager des leçons',
      intro: 'Les leçons et les cours sont des fichiers que vous pouvez donner à d’autres.',
      points: [
        '« Exporter » enregistre une leçon, « Exporter le cours » un cours entier, « Exporter toutes mes leçons » tout ce que vous avez créé.',
        '« Ajouter un fichier de leçon ou de cours » lit n’importe lequel de ces fichiers. Chaque leçon est vérifiée avant d’être ajoutée.',
        'Les fichiers contiennent les leçons et les interros, pas les scores.',
      ],
    },
    'providers': {
      title: 'Choisir une IA',
      intro: 'Les élèves sont joués par un modèle d’IA que vous choisissez dans les Réglages. Plusieurs sont gratuits.',
      points: [
        'Collez la clé dans les Réglages, laissez le modèle vide et appuyez sur « Tester la connexion ». Le jeu choisit un modèle adapté.',
        'Votre clé reste uniquement dans ce navigateur. Ne la collez jamais ailleurs.',
        'Faire tourner un modèle sur votre propre ordinateur marche aussi (Ollama, LM Studio, llama.cpp). Voir le README.',
      ],
    },
    'limits': {
      title: 'Les limites gratuites',
      intro: 'Les offres IA gratuites limitent le nombre de requêtes par minute ou par jour. Une leçon utilise environ 40 à 50 requêtes, plus deux après l’interro pour la vérification et l’explication.',
      points: [
        '« Requêtes IA aujourd’hui » dans le menu ☰ compte ce que ce navigateur a envoyé.',
        'Quand une limite est atteinte, le jeu attend un instant et réessaie, ou passe tout seul à un autre modèle.',
        'Avec une limite quotidienne fixée dans les Réglages, la cloche sonne plus tôt pour que l’interro ait toujours assez de requêtes.',
      ],
    },
    'errors': {
      title: 'Quand quelque chose ne va pas',
      intro: 'Si l’IA ne peut pas répondre, un message rouge apparaît avec un bouton « Réessayer ». Rien n’est perdu : le même tour est renvoyé.',
      points: [
        '« Impossible de joindre l’adresse de l’IA » : vérifiez l’adresse, ou que votre modèle local tourne.',
        '« A refusé la clé » : la clé est fausse ou supprimée.',
        '« Trop de requêtes » ou « surchargé » : attendez une minute.',
        '« Un format que le jeu ne sait pas lire » : choisissez un modèle plus puissant.',
        'Une leçon en cours est enregistrée après chaque tour, même si la page se ferme.',
      ],
    },
    'realistic': {
      title: 'Mode réaliste',
      intro: 'Cochez « Mode réaliste » dans le menu ☰ pour masquer les cahiers et le compteur d’objectifs. Comme un vrai professeur, vous ne savez ce que les élèves ont compris qu’en les interrogeant.',
      points: [
        'Désactivez-le à tout moment pour tout revoir.',
      ],
    },
  },
};
