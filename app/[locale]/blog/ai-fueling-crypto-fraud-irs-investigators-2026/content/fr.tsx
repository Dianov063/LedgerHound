import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentFr({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">Kyle Holder pensait parler à une vraie personne nommée Niamh. Deux mois de conversations. Une fausse « équipe de service client » l'a coachée sur les portefeuilles et les transferts. Quand elle a compris, ses économies avaient disparu—siphonnées à travers des couches de transactions blockchain. Ce n'est pas une histoire isolée. C'est le nouveau visage de la fraude crypto, et il est alimenté par l'intelligence artificielle.</p>
      <p className="text-lg text-slate-700 leading-relaxed">Les chiffres sont stupéfiants. Selon le <a href="https://gizmodo.com/crypto-investment-scams-were-the-most-costly-type-of-fraud-in-the-u-s-in-2025-2000743099" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">rapport IC3 2025 du FBI</a>, les Américains ont perdu 7,2 milliards de dollars à cause des escroqueries d'investissement crypto en 2025—ce qui en fait le type de fraude le plus coûteux signalé à l'agence. Et les enquêteurs de l'IRS affirment que l'IA est un moteur clé. Dans un <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">rapport de CBS News</a>, des responsables ont révélé comment les voix deepfake, les profils générés par IA et les scripts de chat automatisés rendent les escroqueries plus convaincantes que jamais.</p>
      <p className="text-lg text-slate-700 leading-relaxed">Cet article décompose comment l'IA suralimente la fraude crypto, ce que les enquêteurs de l'IRS voient sur le terrain, et—plus important encore—comment vous pouvez riposter en utilisant la forensique blockchain et des outils gratuits comme le <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">Wallet Tracker de LedgerHound</Link>.</p>

      <h2 id="the-ai-powered-scam-machine">La machine à escroquerie alimentée par l'IA</h2>

      <p>Les escrocs ont toujours été doués pour la manipulation. Mais l'IA leur donne de l'ampleur. Au lieu d'un seul arnaqueur tapant des messages, les chatbots IA exécutent désormais des milliers de conversations simultanément, s'adaptant en temps réel aux réponses des victimes. Les enquêteurs de l'IRS ont déclaré à <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS News</a> que ces bots peuvent imiter l'empathie, l'urgence et même l'intérêt romantique—tout en collectant des données personnelles pour affiner l'attaque.</p>

      <p>Les appels vocaux et vidéo deepfake sont la prochaine frontière. En 2025, le FBI a mis en garde contre des escrocs utilisant des voix clonées par IA de membres de la famille ou de figures d'autorité pour exiger des paiements crypto urgents. La technologie est bon marché et accessible—un échantillon audio de 30 secondes provenant des réseaux sociaux suffit pour cloner une voix. Nous avons vu des cas où des victimes ont reçu un « appel vidéo » de ce qui ressemblait à un agent de support d'échange de confiance, pour perdre tout leur portefeuille.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">7,2 milliards de dollars</p>
        <p className="text-sm text-slate-600">Pertes totales dues aux escroqueries d'investissement crypto signalées au FBI IC3 en 2025—le plus élevé de toutes les catégories de fraude.</p>
      </div>

      <p>Le résultat ? Une perte record de 7,2 milliards de dollars rien que pour les escroqueries d'investissement crypto, selon le <a href="https://gizmodo.com/crypto-investment-scams-were-the-most-costly-type-of-fraud-in-the-u-s-in-2025-2000743099" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">rapport IC3 2025 du FBI</a>. Sans compter les escroqueries romantiques, les ransomwares ou les compromissions d'emails professionnels—qui exigent de plus en plus de crypto.</p>

      <h2 id="irs-investigators-on-the-front-lines">Les enquêteurs de l'IRS en première ligne</h2>

      <p>L'unité d'enquête criminelle de l'IRS (IRS-CI) est particulièrement bien placée pour lutter contre la fraude crypto car le blanchiment d'argent laisse presque toujours une trace fiscale. En 2025, les agents de l'IRS-CI ont enquêté sur des centaines d'affaires liées à la crypto, dont beaucoup impliquaient des fausses identités générées par IA et des sociétés écrans. Selon <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS News</a>, l'agence a constaté une forte augmentation des cas où les escrocs utilisent l'IA pour créer des plateformes d'investissement réalistes qui n'existent que sur le papier.</p>

      <p>Un agent de l'IRS a décrit un cas où une victime a été attirée dans une fausse pool de minage promettant des rendements quotidiens. Le site web avait l'air professionnel, complet avec des témoignages générés par IA et un chatbot en direct répondant aux questions 24h/24 et 7j/7. Quand la victime a essayé de retirer, le bot a exigé des « frais de vérification » supplémentaires—une tactique classique de pig butchering, désormais automatisée.</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">Vous pensez avoir été victime d'une escroquerie ?</h3>
        <p className="text-brand-100 text-sm mb-5">N'attendez pas. Les premières 72 heures sont cruciales pour geler les fonds sur les exchanges. Utilisez notre Wallet Tracker gratuit pour cartographier le flux de votre crypto volée—aucun compte requis.</p>
        <Link href={`${base}/wallet-tracker`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          Essayer Wallet Tracker gratuitement <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="how-ai-enables-pig-butchering-at-scale">Comment l'IA permet le pig butchering à grande échelle</h2>

      <p>Le pig butchering—une escroquerie où les fraudeurs établissent une confiance sur des semaines ou des mois avant de vider les victimes—existe depuis des années. Mais l'IA le suralimente. Au lieu d'un seul escroc gérant une poignée de victimes, l'IA peut gérer des dizaines de « relations » simultanément, en utilisant le traitement du langage naturel pour se souvenir des conversations passées et ajuster les tactiques.</p>

      <p>Les <a href="https://www.jpost.com/international/article-894049" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">sanctions du Trésor américain contre le sénateur cambodgien Kok An</a> et 28 autres personnes en 2026 ont exposé un vaste réseau de centres d'escroquerie utilisant l'IA pour cibler les Américains. Ces opérations employaient des appels vidéo deepfake, des messages vocaux générés par IA, et même de faux articles de presse pour rendre leurs stratagèmes légitimes. Le département du Trésor a allégué que Kok An utilisait ses relations politiques pour protéger ces centres, qui ont volé des millions de dollars aux citoyens américains.</p>

      <ul>
        <li>Chatbots IA imitant des partenaires romantiques ou des conseillers financiers</li>
        <li>Appels vidéo deepfake avec de faux « agents de support »</li>
        <li>Fausses nouvelles et témoignages générés par IA pour établir la crédibilité</li>
        <li>Plateformes de trading automatisées affichant de faux profits</li>
      </ul>

      <h2 id="the-role-of-blockchain-forensics">Le rôle de la forensique blockchain</h2>

      <p>L'IA peut aider les escrocs, mais la forensique blockchain rattrape son retard. Chaque transaction crypto est enregistrée de manière permanente sur le registre. Même lorsque les fonds transitent par des mixeurs ou des ponts inter-chaînes, les outils forensiques peuvent tracer le flux—si vous agissez rapidement.</p>

      <p>Chez LedgerHound, nous avons tracé des fonds volés lors d'escroqueries pilotées par l'IA à travers plusieurs blockchains, y compris Bitcoin, Ethereum et USDT TRC20. Dans un cas, une victime a perdu 47 000 dollars à cause d'un appel « support d'échange » deepfake. Notre analyse a montré que les fonds ont transité par trois chaînes en moins d'une heure, atterrissant sur un exchange conforme KYC. Nous avons aidé à geler le compte avant que l'escroc ne puisse retirer.</p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Mesures immédiates si vous avez été victime d'une escroquerie
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Arrêtez toute communication</p>
            <p className="text-sm text-slate-600">N'interagissez plus. Les escrocs peuvent essayer d'extraire plus d'argent ou d'informations personnelles.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Documentez tout</p>
            <p className="text-sm text-slate-600">Sauvegardez les captures d'écran, adresses de portefeuille, identifiants de transaction et tous les messages. Ce sont des preuves.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Utilisez un tracker de portefeuille</p>
            <p className="text-sm text-slate-600">Entrez l'adresse du portefeuille de l'escroc dans notre <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">Wallet Tracker gratuit</Link> pour voir où les fonds sont allés.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Signalez aux autorités</p>
            <p className="text-sm text-slate-600">Déposez un rapport auprès du <a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">FBI IC3</a> et de votre police locale. Informez également l'exchange où les fonds ont atterri.</p>
          <div className="not-prose ml-8 my-3 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">Astuce</p>
            <p className="text-xs text-slate-600">De nombreux exchanges ne gèlent les comptes qu'après avoir reçu une lettre de conservation. Utilisez gratuitement notre <Link href={`${base}/tools/exchange-letter`} className="text-brand-600 hover:underline">Générateur de lettre de conservation pour exchange</Link>.</p>
          </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">5</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Envisagez un traçage professionnel</p>
            <p className="text-sm text-slate-600">Si le montant est important, un <Link href={`${base}/report`} className="text-brand-600 hover:underline">rapport forensique</Link> peut fournir une chaîne de traçabilité prête pour un tribunal pour les efforts de récupération.</p>
          </div>
        </div>
      </div>

      <h2 id="what-the-future-holds">Ce que l'avenir nous réserve</h2>

      <p>La fraude par IA ne fait que devenir plus sophistiquée. Les enquêteurs de l'IRS prédisent que d'ici 2027, les appels vidéo deepfake seront impossibles à distinguer des vrais. Les escrocs utiliseront l'IA pour personnaliser les attaques en fonction des profils de réseaux sociaux, de l'historique financier et même des données biométriques des victimes.</p>

      <p>Mais il y a de l'espoir. La pression réglementaire augmente. Les <a href="https://www.jpost.com/international/article-894049" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">sanctions du Trésor américain contre Kok An</a> montrent que le gouvernement cible l'infrastructure derrière ces escroqueries. Et les entreprises de forensique blockchain comme LedgerHound construisent des outils qui équilibrent les chances.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">28 individus et entités sanctionnés</p>
        <p className="text-sm text-slate-600">Le Trésor américain a sanctionné 28 individus et entités en 2026 pour avoir mené des escroqueries crypto-romantiques, y compris un sénateur cambodgien.</p>
      </div>

      <p>La clé est la rapidité. L'IA va vite, mais les données blockchain sont permanentes. Si vous agissez en quelques heures—pas en jours—vous avez une réelle chance de récupérer les fonds. C'est pourquoi nous avons créé le <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">Kit de préservation d'urgence de LedgerHound</Link>—un kit étape par étape qui aide les victimes à geler les actifs sur les exchanges avant qu'ils ne disparaissent.</p>

      <h2 id="protect-yourself-in-the-ai-era">Protégez-vous à l'ère de l'IA</h2>

      <p>La prévention reste la meilleure défense. Voici des conseils pratiques pour éviter les escroqueries crypto alimentées par l'IA :</p>

      <ol>
        <li>Vérifiez l'identité via un canal séparé. Si quelqu'un prétend être d'un exchange, appelez le numéro officiel—ne faites pas confiance au numéro qu'ils vous donnent.</li>
        <li>Ne partagez jamais votre phrase de récupération ou vos clés privées. Aucun service légitime ne vous les demandera.</li>
        <li>Soyez sceptique face aux opportunités d'investissement non sollicitées, surtout avec des rendements garantis.</li>
        <li>Utilisez notre <Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">Vérificateur d'escroquerie</Link> pour vérifier toute adresse de portefeuille ou plateforme avant d'envoyer des fonds.</li>
      </ol>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Drapeaux rouges pour les escroqueries par IA
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Communication trop parfaite</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Pas de fautes, toujours disponible, se souvient de chaque détail—les chatbots IA sont parfaits, les humains ne le sont pas.</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Pression pour agir vite</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Les escrocs créent l'urgence pour contourner votre pensée critique. Les investissements légitimes n'expirent pas en 24 heures.</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Appels vidéo faux</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Si la personne à l'écran semble légèrement étrange ou répète des phrases, il pourrait s'agir d'un deepfake. Demandez-lui de tourner la tête ou d'agiter la main.</span></li>
          </ul>
        </div>
      </div>

      <h2 id="ledgerhound-is-here-to-help">LedgerHound est là pour vous aider</h2>

      <p>Nous savons à quel point ces escroqueries sont dévastatrices. Notre équipe d'analystes forensiques certifiés a tracé des milliards de crypto volées à travers des dizaines de blockchains. Que vous ayez besoin d'une vérification rapide ou d'un <Link href={`${base}/report`} className="text-brand-600 hover:underline">rapport forensique</Link> complet pour une action en justice, nous sommes là.</p>

      <p>Commencez par une <Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">évaluation de cas gratuite</Link>—sans engagement. Nous examinerons votre situation et recommanderons les meilleures prochaines étapes. Et si vous êtes pressé, notre <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">Kit de préservation d'urgence</Link> peut être déployé en quelques minutes.</p>

      <p>L'IA peut alimenter la fraude, mais avec les bons outils et l'expertise, vous pouvez riposter. La blockchain ne ment pas—et nous savons comment la lire.</p>
    </>
  );
}
