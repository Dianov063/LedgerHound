import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentFr({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">Le 14 avril 2026, l'OFAC a lancé une bombe : deux casinos mexicains — Casino Centenario et Casino Caballo — ainsi que trois individus, sanctionnés pour blanchiment d'argent au profit du Cartel del Noreste (CDN). Ce n'était pas une sanction de routine. C'est une fenêtre claire sur la façon dont les entreprises traditionnelles en espèces comblent désormais le fossé entre l'argent de la drogue physique et les crypto-monnaies. Du sale boulot.</p>
      <p className="text-lg text-slate-700 leading-relaxed">Nous voyons souvent ce schéma chez LedgerHound. Les cartels utilisent les casinos non seulement pour laver l'argent liquide — ils le convertissent en crypto-monnaies, en particulier en stablecoins, puis déplacent ces fonds instantanément à travers les frontières. Le <a href="https://home.treasury.gov/news/press-releases/sb0440" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">communiqué de presse du Trésor</a> confirme que le CDN gère une « entreprise de blanchiment d'argent et de contrebande d'espèces » couvrant à la fois les actifs traditionnels et numériques. Voici les mécanismes, et pourquoi la forensique blockchain est le seul outil capable de suivre la piste.</p>

      <h2 id="the-casino-crypto-gateway">La passerelle casino-crypto</h2>

      <p>Les casinos ont toujours été les meilleurs amis des blanchisseurs d'argent. Entrez avec de l'argent sale, achetez des jetons, jouez un peu, repartez avec un chèque — ou dans les casinos modernes, un retrait en crypto. L'opération du CDN, selon l'OFAC, impliquait de la contrebande d'espèces en vrac des États-Unis vers le Mexique, puis acheminée via les casinos. Mais voici le twist : une fois dans le système du casino, l'argent liquide est converti en Tether (USDT) ou en d'autres stablecoins sur des échanges partenaires du casino.</p>

      <p>D'un point de vue crypto-forensique, le moment critique est le « on-ramp » — lorsque la monnaie fiduciaire devient crypto. Les casinos offrant des services crypto créent un point d'obfuscation parfait. Contrairement à un échange traditionnel qui exige un KYC, un casino peut traiter de l'argent liquide et émettre de la crypto vers un portefeuille qui semble propre. Notre <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">Wallet Tracker</Link> peut repérer ces portefeuilles en analysant les schémas de transactions — haute fréquence, dépôts à montants ronds, mouvements rapides entre chaînes.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">15 milliards $+</p>
        <p className="text-sm text-slate-600">montant estimé du blanchiment d'argent annuel via les casinos dans le monde, selon le GAFI. Les casinos sanctionnés du CDN ne représentent qu'une fraction de ce montant.</p>
      </div>

      <h2 id="ofac-sanctions-and-blockchain-tracing">Les sanctions de l'OFAC comme outil de traçage</h2>

      <p>Lorsque l'OFAC sanctionne une entité comme Casino Centenario, cela ne gèle pas seulement les actifs — cela crée un effet d'entraînement. Chaque institution financière, y compris les échanges de crypto, est désormais légalement obligée de bloquer les transactions impliquant ce casino. Cela signifie que tout USDT ayant touché ces casinos est désormais « contaminé » et peut être signalé. Dans notre travail, nous utilisons les listes de sanctions de l'OFAC comme point de départ : une fois que nous identifions une adresse sanctionnée, nous remontons la piste pour trouver la source des fonds.</p>

      <p>La <a href="https://home.treasury.gov/news/press-releases/sb0440" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">désignation du Trésor</a> du CDN comme organisation terroriste étrangère en 2025 ajoute une couche supplémentaire. En vertu du décret 13224, toute personne ou entité fournissant un soutien au CDN — y compris via la crypto — peut être sanctionnée. Cela a entraîné une augmentation des demandes de victimes d'arnaques « pig butchering » qui ont envoyé involontairement des fonds vers des portefeuilles ayant ensuite interagi avec des casinos sanctionnés. Notre <Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">Scam Checker</Link> peut recouper les adresses de portefeuille avec la liste SDN de l'OFAC en temps réel.</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">Vérifiez si un portefeuille est lié à des entités sanctionnées</h3>
        <p className="text-brand-100 text-sm mb-5">Utilisez notre Scam Checker gratuit pour voir si une adresse crypto a été signalée par l'OFAC ou dans des arnaques.</p>
        <Link href={`${base}/scam-checker`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          Effectuer une vérification gratuite <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="how-cartels-use-casinos-for-crypto-laundering">Comment les cartels utilisent les casinos pour le blanchiment de crypto</h2>

      <h3>Étape 1 : Contrebande d'espèces</h3>

      <p>Selon le <a href="https://nypost.com/2026/04/14/us-news/us-sanctions-2-mexican-casinos-over-alleged-ties-to-countrys-northeast-cartel/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">rapport du New York Post</a>, les opérateurs du CDN font passer en contrebande des espèces en vrac des États-Unis vers le Mexique, souvent cachées dans des véhicules. L'argent arrive ensuite dans des casinos comme Casino Centenario à Nuevo Laredo.</p>

      <h3>Étape 2 : Conversion au casino</h3>

      <p>Le casino accepte l'argent liquide et émet des jetons ou des crédits. Au lieu de jouer, le cartel peut utiliser le partenaire d'échange crypto du casino pour convertir ces crédits en USDT ou Bitcoin. Cette étape se fait souvent via des bureaux de gré à gré (OTC) gérés par le casino.</p>

      <h3>Étape 3 : Obfuscation inter-chaînes</h3>

      <p>Une fois en crypto, les fonds se déplacent à travers plusieurs blockchains — de TRC20 à ERC20 à BEP20 — pour cacher la piste. Notre <Link href={`${base}/graph-tracer`} className="text-brand-600 hover:underline">Graph Tracer</Link> peut visualiser ces sauts inter-chaînes, mais nécessite une analyse temporelle pour attraper les échanges. Dans un cas, nous avons tracé des fonds qui sont passés d'un portefeuille lié à un casino à un DEX, puis à un portefeuille privé, et enfin à un échange KYC dans l'UE.</p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Si vous soupçonnez un blanchiment lié à un casino
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Identifiez l'adresse du casino</p>
            <p className="text-sm text-slate-600">Vérifiez si le portefeuille que vous enquêtez a interagi avec des adresses de dépôt de casino connues. Utilisez notre Scam Checker pour rechercher des entités liées à l'OFAC.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Tracez les mouvements inter-chaînes</p>
            <p className="text-sm text-slate-600">Utilisez notre Graph Tracer pour suivre les fonds à travers les réseaux TRC20, ERC20 et BEP20. Recherchez des conversions rapides qui suggèrent une obfuscation intentionnelle.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Générez un rapport forensique</p>
            <p className="text-sm text-slate-600">Notre rapport automatisé compile la chaîne de possession et signale toute adresse sanctionnée. Il est prêt pour le tribunal et peut être utilisé pour déposer une plainte.</p>
          </div>
        </div>
      </div>

      <h2 id="why-casinos-are-perfect-for-cartel-crypto">Pourquoi les casinos sont parfaits pour la crypto des cartels</h2>

      <p>Les casinos offrent trois choses dont les cartels ont besoin : un volume d'argent liquide élevé, une surveillance minimale et un accès à la crypto. Contrairement aux banques, les casinos dans de nombreuses juridictions ne sont pas tenus de déclarer les transactions inférieures à 10 000 $. Et même lorsqu'ils déposent des rapports de transactions en espèces (CTR), les informations mènent rarement à des adresses blockchain.</p>

      <p>L'<a href="https://www.greenwichtime.com/news/world/article/us-sanctions-2-casinos-and-3-persons-over-alleged-22206577.php" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">article de Greenwich Time</a> note que les individus sanctionnés incluent des directeurs de casino et des coursiers d'argent. Cela nous indique que le cartel a des opérateurs infiltrés dans les casinos eux-mêmes. D'après notre expérience, un tel accès interne leur permet de contourner même les contrôles AML de base.</p>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} /> Blanchiment via casino (traditionnel)
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Espèces → Jetons → Espèces (chèque)</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Lent, mouvement physique</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Nécessite la complicité du personnel du casino</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Traçable via surveillance</span></li>
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Blanchiment casino-crypto
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Espèces → Casino → USDT → Multiples chaînes</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Transfert instantané mondial</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Exploitation interne + contrats intelligents</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Traçable uniquement avec la forensique blockchain</span></li>
          </ul>
        </div>
      </div>

      <h2 id="what-this-means-for-scam-victims">Ce que cela signifie pour les victimes d'arnaques</h2>

      <p>Si vous avez été arnaqué et que vos fonds sont allés vers un portefeuille qui a ensuite touché une adresse liée à un casino, la récupération est plus difficile mais pas impossible. Les sanctions de l'OFAC signifient que tout USDT détenu par ces casinos est gelé sur les échanges conformes comme Binance ou Kraken. Mais le cartel a probablement déplacé les fonds avant que les sanctions ne frappent.</p>

      <p>Dans notre travail chez LedgerHound, nous avons récupéré des fonds en déposant des lettres de conservation auprès des échanges qui ont reçu la crypto blanchie. La vitesse est cruciale : le <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">Emergency Preservation Pack</Link> envoie des notifications légales simultanées à jusqu'à 10 échanges, gelant les fonds avant qu'ils ne puissent être retirés. Nous avons eu du succès lorsque les victimes ont agi dans les 48 heures.</p>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Critique : Ne comptez pas sur l'aide des casinos
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Les casinos ne sont pas vos alliés</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Les casinos sanctionnés ne coopéreront pas avec les victimes</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Ils peuvent détruire les documents dès qu'ils apprennent une enquête</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Votre meilleure chance est de tracer la crypto vers un échange réglementé</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Que faire immédiatement</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Documentez chaque hash de transaction et adresse de portefeuille</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Effectuez une vérification gratuite des arnaques sur notre site pour voir si des adresses sont signalées</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Contactez un avocat agréé dans votre juridiction</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Utilisez notre générateur de lettre de conservation pour geler les fonds sur les échanges</span></li>
          </ul>
        </div>
      </div>

      <h2 id="the-future-of-cartel-crypto-laundering">L'avenir du blanchiment de crypto par les cartels</h2>

      <p>Les sanctions contre les casinos du CDN sont un signe des choses à venir. Alors que de plus en plus de casinos adoptent des services crypto, ils deviennent des cibles privilégiées pour le blanchiment d'argent. Les régulateurs ripostent : la règle proposée par FinCEN sur les déclarations de crypto dans les casinos, attendue fin 2026, exigerait que les casinos traitent les transactions crypto comme des transactions en espèces.</p>

      <p>Mais d'un point de vue forensique, la blockchain ne ment jamais. Chaque transaction est enregistrée. Le défi est de relier les points entre l'argent liquide du casino et les portefeuilles crypto. C'est là que notre expertise entre en jeu. Nous avons développé des algorithmes qui détectent les schémas de transactions liés aux casinos — comme des dépôts à montants ronds suivis de multiples petits retraits — qui indiquent un placement.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">6</p>
        <p className="text-sm text-slate-600">cibles sanctionnées par l'OFAC dans l'action d'avril 2026 : 2 casinos et 3 individus (plus une entité non nommée). L'enquête est en cours.</p>
      </div>

      <p>Si vous êtes victime d'une arnaque pouvant impliquer un blanchiment via casino, n'attendez pas. Plus vous attendez, plus le cartel ajoute de couches. <Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">Obtenez une évaluation gratuite</Link> de votre cas dès aujourd'hui.</p>
    </>
  );
}
