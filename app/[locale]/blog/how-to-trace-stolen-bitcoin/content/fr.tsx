import Link from 'next/link';
import { CheckCircle2, Shield, ArrowRight } from 'lucide-react';

export default function ContentFr({ base }: { base: string }) {
  return (
    <>
      {/* Intro */}
      <p className="text-lg text-slate-700 leading-relaxed">
        Vous avez envoyé de la cryptomonnaie vers ce que vous pensiez être une plateforme d'investissement, un exchange ou un contact légitime — et maintenant tout a disparu. Votre première question est probablement : <em>Est-il seulement possible de tracer des cryptomonnaies ?</em>
      </p>
      <p>
        La réponse, dans la plupart des cas, est oui.
      </p>
      <p>
        Contrairement à l'idée répandue selon laquelle les cryptomonnaies seraient anonymes et intraçables, c'est en réalité l'inverse pour la plupart des blockchains majeures. Chaque transaction Bitcoin, chaque transfert Ethereum, chaque mouvement USDT — tout est enregistré de manière permanente dans un registre public que n'importe qui dans le monde peut consulter. Y compris les enquêteurs.
      </p>
      <p>
        Ce guide explique en détail comment fonctionne le traçage de cryptomonnaies, ce que font les enquêteurs étape par étape, et ce que vous pouvez faire dès maintenant pour maximiser vos chances de récupération.
      </p>

      {/* Section 1 */}
      <h2 id="blockchain-transparency">La vérité fondamentale sur la transparence de la blockchain</h2>
      <p>
        Le Bitcoin et la plupart des grandes cryptomonnaies sont <strong>pseudonymes, et non anonymes</strong>. C'est une distinction essentielle.
      </p>
      <p>
        Votre adresse de portefeuille ne contient pas votre nom. Mais chaque transaction que vous effectuez — vers qui, combien, quand — est inscrite de manière permanente sur une blockchain publique qui ne peut être ni modifiée ni supprimée.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">Pseudonyme, pas anonyme</p>
        <p className="text-sm text-slate-600">
          Malgré les premières perceptions d'anonymat, la plupart des transactions en cryptomonnaie peuvent être tracées grâce à l'analyse blockchain. Chaque transfert de valeur est enregistré de manière permanente sur des registres publics tels que Bitcoin ou Ethereum.
        </p>
      </div>

      <p>
        Cette transparence radicale a transformé les enquêtes financières. Le défi n'est pas de savoir si les transactions peuvent être vues — mais d'interpréter ce qu'elles signifient et de relier des adresses pseudonymes à des identités réelles.
      </p>

      {/* Section 2 */}
      <h2 id="whats-visible">Quelles informations sont visibles sur la blockchain</h2>
      <p>
        Lorsque vous envoyez de la cryptomonnaie, les informations suivantes sont enregistrées de manière permanente :
      </p>

      {/* Info box */}
      <div className="not-prose my-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-blue-700 font-display font-bold text-lg">
          <Shield size={20} />
          Ce que la blockchain enregistre
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Toujours visible :</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Adresse du portefeuille émetteur</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Adresse du portefeuille destinataire</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Montant transféré</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Date et heure (horodatage exact du bloc)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Hash de transaction (identifiant unique)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Frais de réseau payés</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Parfois récupérable :</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> Adresse IP de l'émetteur (capturée par les noeuds du réseau au moment de la diffusion)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> Données de géolocalisation (à partir de l'IP)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> Lien avec d'autres adresses contrôlées par la même personne</li>
          </ul>
        </div>
      </div>

      <p>
        Cela signifie qu'à partir d'une seule adresse de portefeuille ou d'un hash de transaction, un enquêteur peut reconstituer l'historique complet de l'origine et de la destination des fonds.
      </p>

      {/* Section 3 */}
      <h2 id="how-tracing-works">Étape par étape : comment fonctionne réellement le traçage crypto</h2>

      <h3>Étape 1 : Collecte — Rassembler les preuves initiales</h3>
      <p>
        Chaque enquête commence par ce que la victime peut fournir :
      </p>
      <ul>
        <li><strong>Hash de transaction</strong> — l'identifiant unique de votre paiement (ressemble à <code>0x7f3a...</code>)</li>
        <li><strong>Adresse de portefeuille</strong> — l'adresse à laquelle vous avez envoyé les fonds</li>
        <li><strong>Nom de la plateforme</strong> — le site web ou l'application frauduleuse</li>
        <li><strong>Dates et montants</strong> — quand chaque transfert a été effectué</li>
        <li><strong>Captures d'écran</strong> — de la plateforme, des communications, de votre compte</li>
      </ul>
      <p>
        Même si vous ne disposez que d'un seul de ces éléments, un traçage peut généralement commencer. Dans la plupart des cas, une seule adresse de portefeuille ou un hash de transaction suffit pour démarrer.
      </p>

      <h3>Étape 2 : Cartographie des transactions</h3>
      <p>
        L'enquêteur charge l'adresse de départ dans une plateforme d'intelligence blockchain (Chainalysis Reactor, TRM Labs, Elliptic ou similaire) et commence à cartographier chaque transaction liée à cette adresse.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">Cartographie visuelle des flux de fonds</p>
        <p className="text-sm text-slate-600">
          Les données transactionnelles sont converties en cartes visuelles et organigrammes, montrant les interactions du sujet avec des exchanges connus et d'autres entités, traçant les transferts financiers jusqu'à leurs points d'arrivée finaux. La cartographie visuelle facilite grandement la reconnaissance de schémas tels que le layering et les peel chains, couramment utilisés pour le blanchiment d'argent.
        </p>
      </div>

      <p>
        Cela crée un graphe visuel — exactement comme notre outil gratuit Graph Tracer — montrant le flux des fonds à travers de multiples portefeuilles.
      </p>

      <h3>Étape 3 : Analyse de clusters</h3>
      <p>
        Une seule adresse constitue rarement le tableau complet. Les criminels utilisent plusieurs portefeuilles pour brouiller les pistes. L'analyse de clusters regroupe les adresses susceptibles d'être contrôlées par la même personne.
      </p>
      <p>
        Un cluster est un ensemble d'adresses de cryptomonnaie contrôlées par la même personne ou entité. Élargir le périmètre d'une enquête d'une seule adresse à un cluster plus large peut considérablement augmenter la quantité de preuves disponibles pour la désanonymisation et le traçage d'actifs.
      </p>
      <p>
        Les techniques de clustering courantes incluent :
      </p>
      <ul>
        <li><strong>Analyse de dépenses communes</strong> — plusieurs adresses utilisées dans la même transaction</li>
        <li><strong>Réutilisation d'adresses</strong> — la même adresse utilisée de manière répétée</li>
        <li><strong>Analyse temporelle</strong> — transactions suivant des schémas récurrents</li>
      </ul>

      <h3>Étape 4 : Identification des exchanges — La percée décisive</h3>
      <p>
        C'est à ce stade que les enquêtes deviennent exploitables. Lorsque les fonds volés arrivent sur un <strong>exchange conforme KYC</strong> (Coinbase, Binance, Kraken, OKX, etc.), l'exchange dispose légalement d'une vérification d'identité du titulaire du compte.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">La voie de l'assignation</p>
        <p className="text-sm text-slate-600">
          Les outils d'intelligence blockchain identifient les transactions avec des exchanges tels que Coinbase et Binance. Des assignations auprès d'entités conformes KYC/AML permettent d'obtenir les documents d'identité du propriétaire des bitcoins — transformant des adresses pseudonymes en identités réelles.
        </p>
      </div>

      <p>
        Une fois que les enquêteurs ont identifié quel exchange a reçu les fonds, un avocat peut déposer une assignation — obligeant l'exchange à révéler le nom, l'adresse, les documents d'identité et les informations bancaires du titulaire du compte.
      </p>

      <h3>Étape 5 : Analyse d'attribution</h3>
      <p>
        Les plateformes professionnelles d'intelligence blockchain maintiennent des bases de données de millions d'adresses de portefeuilles étiquetées — exchanges, mixeurs, protocoles DeFi, entités criminelles connues et adresses signalées.
      </p>
      <p>
        Les professionnels de la forensique blockchain utilisent un ensemble d'outils open source, commerciaux et propriétaires. La base de tout travail forensique est l'explorateur de blockchain. Les explorateurs forensiques avancés incluent des métadonnées supplémentaires : étiquettes de portefeuilles (par ex. « Hot Wallet Binance », « Mixeur signalé »), scores de risque basés sur des associations connues avec des fraudes.
      </p>
      <p>
        Lorsque des fonds volés touchent une de ces adresses étiquetées, les enquêteurs peuvent immédiatement identifier l'entité concernée.
      </p>

      <h3>Étape 6 : Renseignement par adresse IP</h3>
      <p>
        Il s'agit d'une méthode de traçage moins connue mais puissante. Lorsqu'une transaction est diffusée sur le réseau blockchain, l'adresse IP de l'ordinateur émetteur peut être capturée par des noeuds de surveillance exploités par des entreprises d'intelligence blockchain.
      </p>
      <p>
        Des métadonnées permettant de lever l'anonymat sont collectées via des systèmes de surveillance blockchain, qui exploitent des réseaux de noeuds « écoutant » et « reniflant » les adresses IP associées à certaines transactions. Les adresses IP, lorsqu'elles sont disponibles, peuvent fournir des informations sur la localisation géographique du sujet au moment de la transaction.
      </p>
      <p>
        Cela peut situer l'escroc dans une ville ou un pays spécifique — un renseignement crucial pour la coordination internationale des forces de l'ordre.
      </p>

      <h3>Étape 7 : Rapport forensique</h3>
      <p>
        L'ensemble est compilé dans un rapport forensique recevable en justice contenant :
      </p>
      <ul>
        <li>Cartographie complète des transactions de la victime à la destination finale</li>
        <li>Toutes les adresses de portefeuilles identifiées</li>
        <li>Identification des exchanges avec recommandations d'assignation</li>
        <li>Évaluation des risques et attribution des entités</li>
        <li>Certification de l'enquêteur et documentation de la méthodologie</li>
      </ul>

      {/* Section 4 */}
      <h2 id="obfuscation-techniques">Techniques d'obfuscation courantes — Et comment les enquêteurs les contournent</h2>
      <p>
        Les escrocs savent que les enquêteurs existent. Ils utilisent des techniques pour brouiller les pistes. Voici ce qu'ils tentent — et comment la forensique y répond.
      </p>

      <h3>Mixeurs et tumblers (par ex. Tornado Cash)</h3>
      <p>
        <strong>Ce qu'ils font :</strong> Mélangent des cryptomonnaies provenant de sources multiples et redistribuent des montants équivalents, brisant la chaîne de transactions.
      </p>
      <p>
        <strong>Comment les enquêteurs répondent :</strong> Les techniques modernes de démixage analysent le timing, les montants et les schémas des entrées et sorties des mixeurs pour tracer probabilistiquement les fonds à travers le service. Le démixage automatique de Crystal Expert analyse les entrées et sorties des mixeurs pour identifier jusqu'à cinq parcours candidats depuis le service de mixage.
      </p>
      <p>
        De plus, Tornado Cash a été sanctionné par l'OFAC en 2022 — tout exchange recevant des fonds de Tornado Cash est tenu de les geler en vertu de la loi américaine sur les sanctions.
      </p>

      <h3>Chain Hopping (transferts inter-chaînes)</h3>
      <p>
        <strong>Ce qu'ils font :</strong> Convertissent du Bitcoin en Ethereum, puis en USDT, puis en BNB — sautant d'une blockchain à l'autre pour semer la confusion chez les enquêteurs.
      </p>
      <p>
        <strong>Comment les enquêteurs répondent :</strong> Les outils modernes tracent automatiquement à travers les chaînes. Les plateformes d'intelligence blockchain comme TRM Labs peuvent suivre les flux de fonds, détecter les comportements suspects et relier l'activité à des acteurs réels — notamment lorsqu'elles sont combinées avec des renseignements hors chaîne.
      </p>

      <h3>Peel Chains</h3>
      <p>
        <strong>Ce qu'ils font :</strong> Envoient les fonds à travers une longue chaîne de portefeuilles, chacun transmettant la majeure partie des fonds au suivant et conservant une petite somme — comme éplucher un oignon.
      </p>
      <p>
        <strong>Comment les enquêteurs répondent :</strong> Les outils automatisés de cartographie des transactions suivent les peel chains automatiquement, quel que soit le nombre de sauts. Le schéma lui-même constitue un signal d'alerte qui rend les fonds plus faciles à identifier.
      </p>

      <h3>Cryptomonnaies confidentielles (Monero)</h3>
      <p>
        <strong>Ce qu'ils font :</strong> Utilisent Monero (XMR), qui intègre des fonctionnalités de confidentialité masquant les détails des transactions.
      </p>
      <p>
        <strong>Comment les enquêteurs répondent :</strong> C'est le scénario le plus difficile. Les transactions purement Monero sont extrêmement difficiles à tracer. Cependant, la plupart des escrocs finissent par convertir en Bitcoin ou en stablecoins pour encaisser — et ce point de conversion est traçable.
      </p>

      {/* Mid-article CTA - uses ui strings, kept as-is with base prop */}

      {/* Section 5 */}
      <h2 id="what-you-need">Ce dont vous avez besoin pour lancer un traçage</h2>
      <p>
        Vous n'avez pas besoin de tout cela — mais plus vous en avez, plus l'enquête sera rapide et complète :
      </p>

      {/* Checklist box */}
      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Checklist d'investigation
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Essentiel (au moins un) :</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Adresse du portefeuille vers lequel vous avez envoyé les fonds</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Hash de transaction / TX ID</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Nom de la plateforme ou de l'exchange utilisé</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Utile :</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Dates et montants exacts de chaque transfert</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Captures d'écran de votre compte sur la plateforme</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Communications avec l'escroc</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> URL de la plateforme et détails d'inscription</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Bonus :</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Tout nom, numéro de téléphone ou e-mail fourni par l'escroc</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Profils de réseaux sociaux utilisés dans l'arnaque</li>
          </ul>
        </div>
      </div>

      {/* Section 6 */}
      <h2 id="how-long">Combien de temps prend un traçage ?</h2>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="font-bold text-slate-800 text-sm mb-1">Traçage basique</p>
          <p className="text-xs text-slate-500 mb-2">Blockchain unique, piste claire</p>
          <p className="text-2xl font-display font-bold text-brand-600">24-48 heures</p>
          <p className="text-xs text-slate-500 mt-1">pour le rapport initial</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="font-bold text-slate-800 text-sm mb-1">Investigation complète</p>
          <p className="text-xs text-slate-500 mb-2">Multi-chaînes, routage complexe</p>
          <p className="text-2xl font-display font-bold text-brand-600">3-7 jours</p>
          <p className="text-xs text-slate-500 mt-1">jours ouvrés</p>
        </div>
      </div>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">Le temps est crucial</p>
        <p className="text-sm text-slate-600">
          Agir dans les 72 premières heures augmente considérablement vos chances de récupération. Plus le traçage commence tôt, plus les chances sont élevées de retrouver les fonds avant qu'ils ne soient entièrement liquidés, d'atteindre les exchanges pendant que les comptes sont encore actifs et de déposer des demandes de gel d'urgence.
        </p>
      </div>

      {/* Section 7 */}
      <h2 id="free-tools">Outils gratuits à utiliser dès maintenant</h2>
      <p>
        Avant de faire appel à un enquêteur professionnel, vous pouvez commencer à collecter des informations par vous-même grâce à des outils gratuits :
      </p>

      <h3>Explorateurs de blockchain</h3>
      <ul>
        <li><strong>Etherscan.io</strong> — Ethereum, tokens ERC-20, NFT</li>
        <li><strong>Blockchain.com</strong> — Bitcoin</li>
        <li><strong>BscScan.com</strong> — BNB Chain</li>
        <li><strong>Tronscan.org</strong> — Tron/USDT</li>
      </ul>
      <p>
        Saisissez n'importe quelle adresse de portefeuille ou hash de transaction pour consulter l'historique complet des transactions.
      </p>

      <h3>Outils gratuits LedgerHound</h3>
      <ul>
        <li><strong><Link href={`${base}/tracker`} className="text-brand-600 hover:text-brand-700">Wallet Tracker</Link></strong> — Entrez n'importe quelle adresse Ethereum et consultez l'historique complet des transactions avec des analyses</li>
        <li><strong><Link href={`${base}/graph-tracer`} className="text-brand-600 hover:text-brand-700">Graph Tracer</Link></strong> — Visualisez le flux des fonds sous forme de graphe interactif, identifiez les exchanges connus</li>
      </ul>
      <p>
        Ces outils vous montrent les mêmes données on-chain que celles utilisées par les enquêteurs professionnels comme point de départ — bien que le traçage de niveau professionnel nécessite des bases de données d'attribution propriétaires et une méthodologie certifiée pour un usage juridique.
      </p>

      {/* Section 8 */}
      <h2 id="when-to-hire">Quand faire appel à un professionnel</h2>
      <p>
        Les outils gratuits constituent un point de départ. La forensique blockchain professionnelle est nécessaire lorsque :
      </p>
      <ul>
        <li><strong>Vous avez besoin de preuves recevables en justice</strong> — les tribunaux exigent une méthodologie certifiée, pas des captures d'écran</li>
        <li><strong>Les fonds ont été mixés ou transférés entre chaînes</strong> — cela nécessite des outils de démixage spécialisés</li>
        <li><strong>Vous devez assigner un exchange</strong> — les avocats ont besoin d'un rapport forensique identifiant la cible</li>
        <li><strong>Les forces de l'ordre sont impliquées</strong> — les rapports professionnels ont une autorité que l'analyse amateur n'a pas</li>
        <li><strong>Le montant est significatif</strong> — si vous avez perdu 10 000 $ ou plus, une investigation professionnelle est généralement rentabilisée</li>
      </ul>

      {/* Section 9 */}
      <h2 id="what-happens-after">Que se passe-t-il après le traçage</h2>
      <p>
        Un traçage forensique réussi identifie <em>où</em> les fonds sont allés. La récupération nécessite une action juridique :
      </p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Étapes de récupération après un traçage
        </div>

        <div className="space-y-5">
          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
              Assignation de l'exchange
            </p>
            <p className="text-sm text-slate-600 ml-8">Votre avocat assigne l'exchange identifié pour obtenir les informations du titulaire du compte. La plupart des grands exchanges répondent sous 2 à 4 semaines.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
              Demande de gel d'urgence
            </p>
            <p className="text-sm text-slate-600 ml-8">De nombreux exchanges gèlent volontairement les comptes lorsqu'un rapport forensique professionnel et un signalement aux forces de l'ordre leur sont présentés, avant même une assignation formelle.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
              Action en justice civile
            </p>
            <p className="text-sm text-slate-600 ml-8">Une fois le titulaire du compte identifié, des actions civiles peuvent être engagées pour fraude, détournement et enrichissement sans cause.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
              Signalement aux forces de l'ordre
            </p>
            <p className="text-sm text-slate-600 ml-8">Le FBI IC3 et les autorités nationales agissent sur la base de rapports forensiques. Les affaires significatives peuvent être éligibles à l'équipe de récupération d'actifs du FBI (RAT), qui dispose d'un pouvoir de gel d'actifs en urgence.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">5</span>
              Procédures de confiscation du DOJ
            </p>
            <p className="text-sm text-slate-600 ml-8">Dans les affaires liées au crime organisé, les procédures de confiscation du DOJ peuvent aboutir à la redistribution des fonds aux victimes.</p>
          </div>
        </div>
      </div>

      {/* Getting Help */}
      <h2>Lancez votre traçage dès aujourd'hui</h2>
      <p>
        <strong>LedgerHound</strong> fournit des investigations forensiques blockchain certifiées pour les victimes de vol et de fraude en cryptomonnaie. Notre équipe :
      </p>
      <ul>
        <li>Trace les fonds volés sur toutes les principales blockchains</li>
        <li>Identifie les exchanges et entités ayant reçu vos fonds</li>
        <li>Fournit des rapports forensiques recevables en justice sous 48 à 72 heures</li>
        <li>Accompagne le processus d'assignation des avocats et les signalements aux forces de l'ordre</li>
        <li>Réalise des consultations en russe, anglais, espagnol, chinois, français et arabe</li>
      </ul>
    </>
  );
}
