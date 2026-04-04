import Link from 'next/link';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ContentFr({ base }: { base: string }) {
  return (
    <>
      {/* Intro */}
      <p className="text-lg text-slate-700 leading-relaxed">
        Vous avez rencontre quelqu'un en ligne il y a quelques mois. Peut-etre sur LinkedIn, Instagram ou une application de rencontres. Cette personne etait sympathique, interessante et jamais insistante. Au fil des semaines, vous avez construit une vraie connexion -- des messages quotidiens, des appels telephoniques, peut-etre meme des appels video.
      </p>
      <p>
        Puis un jour, presque par hasard, elle a mentionne qu'elle gagnait beaucoup d'argent en tradant des cryptomonnaies. Elle vous a montre son compte. Les chiffres etaient incroyables. Elle a propose de vous aider a demarrer.
      </p>
      <p>
        Vous avez investi un peu. Ca a fonctionne. Vous avez investi davantage. Ca continuait a fonctionner. Puis vous avez essaye de retirer vos fonds -- et tout s'est arrete.
      </p>
      <p>
        Si cela vous semble familier, vous etes peut-etre victime d'une <strong>arnaque a l'engraissement</strong> (pig butchering) -- la forme de fraude aux cryptomonnaies la plus devastatrice financierement au monde aujourd'hui.
      </p>

      {/* Section 1 */}
      <h2 id="what-is">Qu'est-ce qu'une arnaque a l'engraissement (Pig Butchering) ?</h2>
      <p>
        Le terme vient de l'expression chinoise <em>sha zhu pan</em> (杀猪盘) -- litteralement "planche a abattage de cochon". Le nom reflete la strategie : les escrocs "engraissent" les victimes avec de petits profits initiaux et un investissement emotionnel avant l'"abattage" final -- un vol total de tout ce qui a ete depose.
      </p>
      <p>
        Ce ne sont pas des arnaques rapides et opportunistes. Ce sont des operations de confiance de longue duree, s'etalant souvent sur des semaines ou des mois, menees par des reseaux criminels organises principalement bases en Asie du Sud-Est.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">9,3 milliards de dollars</p>
        <p className="text-sm text-slate-600">
          de pertes signalees liees aux plaintes concernant les cryptomonnaies aupres de l'IC3 du FBI en 2024 -- soit une augmentation de 66 % par rapport a l'annee precedente. La fraude a l'investissement representait 5,8 milliards de dollars de ce total.
        </p>
      </div>

      <p>
        Selon le rapport 2026 sur la criminalite crypto de TRM, environ 35 milliards de dollars ont ete envoyes vers des systemes frauduleux en 2025, les arnaques a l'engraissement representant une part significative.
      </p>

      {/* Section 2 */}
      <h2 id="how-it-works">Comment fonctionnent les arnaques a l'engraissement : le mode operatoire complet</h2>

      <h3>Phase 1 : La mise en place (Semaines 1 a 4)</h3>
      <p>
        Le contact commence de maniere anodine. Un message sur WhatsApp depuis un mauvais numero. Une nouvelle demande de connexion sur LinkedIn. Un match sur une application de rencontres. L'escroc -- operant souvent depuis un camp de travail force au Cambodge, au Myanmar ou au Laos -- se presente comme un professionnel a succes, generalement asiatique-americain, souvent seduisant, toujours charmant.
      </p>
      <p>
        Il n'est pas question d'argent ni d'investissement a cette etape. L'objectif est simplement de construire une relation. Des messages de bonjour quotidiens. Partager des repas en video. Parler de famille, de reves, d'avenir.
      </p>

      <h3>Phase 2 : L'introduction (Semaines 4 a 8)</h3>
      <p>
        Une fois la confiance etablie, l'escroc mentionne "accidentellement" ses succes en investissement. Il est reticent a en parler -- il ne veut pas avoir l'air de se vanter. Mais vous posez des questions. Il vous explique que son oncle travaille dans une entreprise de cryptomonnaies et lui a enseigne une methode de trading speciale.
      </p>
      <p>
        Il propose de vous montrer -- juste pour vous aider, sans aucun interet. Il vous guide pour creer un compte sur une plateforme dont vous n'avez jamais entendu parler. La plateforme a l'air totalement professionnelle : graphiques en temps reel, chat de support client, application mobile elegante.
      </p>
      <p>
        Vous deposez un petit montant. Vous le regardez croitre. Vous retirez un peu -- ca fonctionne, instantanement. Vous etes convaincu.
      </p>

      <h3>Phase 3 : L'engraissement (Semaines 8 a 20)</h3>
      <p>
        Les montants d'investissement augmentent maintenant. L'escroc vous encourage a deposer davantage -- "le marche bouge, c'est une opportunite unique dans l'annee". Il depose son propre argent a cote du votre (fictif, bien sur -- tout se passe sur une plateforme frauduleuse qu'il controle).
      </p>
      <p>
        Votre compte affiche des rendements extraordinaires. Des gains de 30 %, 50 %, 100 %. Vous partagez les captures d'ecran avec vos amis. Vous avez l'impression d'avoir enfin trouve la liberte financiere.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">Augmentation de 253 %</p>
        <p className="text-sm text-slate-600">
          du montant moyen des paiements frauduleux entre 2024 et 2025 -- passant de 782 $ a 2 764 $ par transaction, alors que les escrocs continuent de s'adapter et d'innover.
        </p>
      </div>

      <h3>Phase 4 : L'abattage</h3>
      <p>
        Lorsque vous essayez de retirer un montant significatif, quelque chose ne va pas. Il y a un "blocage fiscal". Des "frais de verification". Un "depot de conformite" exige par la reglementation. On vous dit que vous devez deposer plus d'argent pour debloquer vos fonds.
      </p>
      <p>
        Certaines victimes paient ces frais -- parfois plusieurs fois -- avant de realiser que la plateforme est frauduleuse. Au moment ou l'escroc disparait, les pertes atteignent souvent six chiffres.
      </p>
      <p>
        L'IRS note que les pertes atteignent souvent des centaines de milliers de dollars, certaines victimes perdant jusqu'a 2 millions de dollars.
      </p>

      {/* Section 3 */}
      <h2 id="who-are-scammers">Qui sont les escrocs ?</h2>
      <p>
        Il ne s'agit pas d'un criminel isole dans un sous-sol. L'arnaque a l'engraissement est une operation industrielle.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">Plus de 200 000 personnes</p>
        <p className="text-sm text-slate-600">
          estimees par les Nations Unies comme etant detenues dans des centres d'arnaque a travers l'Asie du Sud-Est -- beaucoup sont elles-memes des victimes de traite, forcees de perpetrer des fraudes sous la menace de violences.
        </p>
      </div>

      <p>
        Les personnes qui vous envoient des messages peuvent elles-memes etre des victimes -- enlevees ou victimes de traite et forcees de mener ces arnaques sous la menace de violences physiques. Les veritables beneficiaires sont les reseaux criminels organises qui gerent les centres.
      </p>
      <p>
        Chainalysis a identifie des liens persistants entre les arnaques aux cryptomonnaies et des operations basees en Asie de l'Est et du Sud-Est, l'intelligence artificielle etant de plus en plus integree dans les operations frauduleuses -- notamment des deepfakes vocaux generes par IA et des outils d'ingenierie sociale sophistiques.
      </p>

      {/* Section 4 - Warning signs (yellow box) */}
      <h2 id="warning-signs">Signes d'alerte d'une arnaque a l'engraissement</h2>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Signaux d'alerte a surveiller
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Comment le contact est etabli :</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Message non sollicite d'un numero inconnu ("mauvais numero" qui vous atteint par accident)</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Un(e) inconnu(e) etrangement seduisant(e) vous contacte sur LinkedIn ou une application de rencontres</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Le contact evolue rapidement vers des messages quotidiens et une intimite emotionnelle</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">L'argumentaire d'investissement :</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Ils mentionnent les profits crypto de maniere decontractee, pas comme un argumentaire de vente</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Ils proposent de vous "aider" -- pas de vous vendre quoi que ce soit</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> La plateforme qu'ils recommandent est une dont vous n'avez jamais entendu parler</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Les premiers petits retraits fonctionnent parfaitement (c'est fait expres)</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Signaux d'alerte sur la plateforme :</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Introuvable sur les stores d'applications -- necessite un telechargement via un lien</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Le support client est uniquement par chat, jamais par telephone</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Le retrait necessite des depots supplementaires ("taxe", "frais de conformite")</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Les profits semblent impossiblement eleves sans explication des risques</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">La relation :</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Ils refusent les appels video ou utilisent de la video preenregistree (deepfakes)</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Ils evitent de se rencontrer en personne malgre une forte connexion emotionnelle</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Ils deviennent insistants quand vous hesitez a investir davantage</li>
          </ul>
        </div>
      </div>

      {/* Section 5 - What to do (green box) */}
      <h2 id="what-to-do">Que faire si vous avez ete victime d'une arnaque</h2>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Mesures a prendre pour les victimes
        </div>

        <div className="space-y-5">
          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
              Arretez immediatement tous les transferts
            </p>
            <p className="text-sm text-slate-600 ml-8">N'envoyez plus d'argent, quoi qu'on vous dise. Tout "frais pour debloquer les fonds" est une couche supplementaire de l'arnaque. Il n'existe aucun frais legitime exigeant que les victimes deposent davantage de cryptomonnaies.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
              Conservez toutes les preuves
            </p>
            <p className="text-sm text-slate-600 ml-8">Faites des captures d'ecran de tout avant que l'escroc disparaisse : toutes les conversations (WhatsApp, Telegram, WeChat, Line), l'URL de la plateforme frauduleuse et les captures d'ecran de votre compte, tous les releves de transactions et adresses de portefeuilles, les photos de profil et coordonnees de l'escroc.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
              Signalez aux autorites
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-1">
              <p><strong>FBI IC3 :</strong> ic3.gov -- deposez une plainte detaillee avec toutes les informations de transaction</p>
              <p><strong>FTC :</strong> reportfraud.ftc.gov</p>
              <p><strong>Le bureau du procureur general de votre Etat</strong></p>
            </div>
          </div>

          <div className="not-prose ml-8 my-4 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">FBI Operation Level Up</p>
            <p className="text-xs text-slate-600">A notifie plus de 8 103 victimes de fraude a l'investissement en cryptomonnaies, dont 77 % ignoraient qu'elles etaient arnaquees. Economies estimees : plus de 511 millions de dollars grace a une intervention precoce.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
              Obtenez une investigation forensique blockchain
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-2">
              <p>C'est la ou l'aide professionnelle fait une vraie difference. Chaque transaction en cryptomonnaie est enregistree de maniere permanente sur la blockchain -- y compris les votres. Un enqueteur certifie peut :</p>
              <ul className="space-y-1">
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Tracer exactement ou vos fonds sont alles apres que vous les avez envoyes</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Identifier quelles plateformes d'echange ont recu les cryptomonnaies volees</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Produire un rapport forensique exploitable en justice documentant le flux complet des fonds</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Identifier les cibles de subpoena (plateformes d'echange conformes KYC)</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Appuyer les forces de l'ordre et votre avocat avec des renseignements exploitables</li>
              </ul>
              <p className="font-semibold text-slate-700 mt-2">Plus cela est fait rapidement, mieux c'est. Les fonds qui arrivent sur une plateforme d'echange peuvent potentiellement etre geles -- mais uniquement s'ils sont identifies et signales rapidement.</p>
            </div>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">5</span>
              Consultez un avocat
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-1">
              <p>Un avocat specialise dans la fraude aux cryptomonnaies peut :</p>
              <p>• Deposer des injonctions de gel d'urgence aupres des plateformes d'echange identifiees</p>
              <p>• Engager des procedures de confiscation civile sur les fonds saisis</p>
              <p>• Vous mettre en relation avec les procedures de confiscation du DOJ le cas echeant</p>
            </div>
          </div>
        </div>
      </div>

      <p>
        Dans une affaire notable, le bureau du procureur federal du Massachusetts a depose une action en confiscation civile pour recuperer environ 2,3 millions de dollars en cryptomonnaies traces jusqu'a un systeme d'arnaque a l'engraissement ciblant un resident local.
      </p>

      {/* Mid-article CTA */}
      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">Victime d'une arnaque a l'engraissement ?</h3>
        <p className="text-brand-100 text-sm mb-5">Obtenez une evaluation gratuite et confidentielle de votre dossier par nos enqueteurs blockchain certifies.</p>
        <Link
          href={`${base}/free-evaluation`}
          className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
        >
          Evaluation gratuite &rarr;
        </Link>
      </div>

      {/* Section 6 */}
      <h2 id="recovery">Pouvez-vous recuperer votre argent ?</h2>
      <p>
        C'est la question que chaque victime pose. La reponse honnete : cela depend de plusieurs facteurs.
      </p>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> Augmente les chances de recuperation</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>• Signalement rapide (dans les jours ou semaines)</li>
            <li>• Disposer des adresses de portefeuilles et des hash de transactions</li>
            <li>• Fonds aboutissant sur une plateforme d'echange conforme KYC</li>
            <li>• Action forensique et juridique coordonnee</li>
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Reduit les chances de recuperation</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>• Fonds passes par un mixeur ou une cryptomonnaie de confidentialite</li>
            <li>• Temps considerable ecoule depuis le vol</li>
            <li>• Fonds transferes vers des plateformes d'echange non reglementees</li>
            <li>• Aucune documentation des transactions</li>
          </ul>
        </div>
      </div>

      <p>
        Meme lorsqu'une recuperation complete n'est pas possible, une investigation forensique fournit une documentation a des fins fiscales (deductions pour pertes dues au vol), des preuves pour les procedures penales des forces de l'ordre, et une contribution aux fonds de confiscation du DOJ qui sont redistribues aux victimes.
      </p>

      {/* Section 7 */}
      <h2 id="law-enforcement">Les forces de l'ordre progressent dans ce domaine</h2>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">Plus de 400 millions de dollars</p>
        <p className="text-sm text-slate-600">
          en cryptomonnaies deja saisis par la Scam Center Strike Force du DOJ, creee en novembre 2025, specifiquement dediee a l'enquete et aux poursuites contre les operations des centres d'arnaque d'Asie du Sud-Est.
        </p>
      </div>

      <p>
        Le DOJ a saisi 61 millions de dollars en USDT lies a des arnaques a l'engraissement en Caroline du Nord -- demontrant que malgre les tentatives de blanchiment a travers des portefeuilles et des blockchains multiples, les enqueteurs peuvent tracer les transactions et identifier les portefeuilles de consolidation contenant les fonds des victimes.
      </p>
      <p>
        Les outils a disposition des enqueteurs -- et la cooperation entre les societes d'analyse blockchain et les forces de l'ordre -- s'ameliorent rapidement. Les victimes qui documentent et signalent correctement leurs cas contribuent a des actions repressives plus larges qui beneficient a l'ensemble de la communaute des victimes.
      </p>

      {/* Section 8 */}
      <h2 id="getting-help">Obtenir de l'aide</h2>
      <p>
        Si vous ou quelqu'un que vous connaissez avez ete touche par une arnaque a l'engraissement, n'attendez pas. La trace sur la blockchain devient plus difficile a suivre avec le temps, et les plateformes d'echange ont des delais limites pour les gels d'urgence.
      </p>

      <p>
        <strong>LedgerHound</strong> fournit des investigations forensiques blockchain certifiees pour les victimes de fraude aux cryptomonnaies. Notre equipe :
      </p>
      <ul>
        <li>Trace les fonds voles sur toutes les principales blockchains</li>
        <li>Identifie les plateformes d'echange et entites qui ont recu vos fonds</li>
        <li>Produit des rapports forensiques exploitables en justice pour les avocats et les forces de l'ordre</li>
        <li>Travaille directement avec les clients russophones -- aucun traducteur necessaire</li>
        <li>Offre une evaluation gratuite et confidentielle de votre dossier sous 24 heures</li>
      </ul>
    </>
  );
}
