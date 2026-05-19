import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentFr({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">29 avril 2026. C'est le jour où tout a changé pour les plateformes crypto. Le procureur général de New York a lâché une bombe : Uphold paierait plus de 5 millions de dollars pour avoir induit les investisseurs en erreur et promu un système frauduleux concocté par Cred, LLC et son PDG. Ce n'est pas juste une amende de plus. C'est un avertissement — directement adressé à chaque exchange, fournisseur de portefeuille et plateforme de trading qui liste des produits tiers sans faire leurs devoirs.</p>
      <p className="text-lg text-slate-700 leading-relaxed">L'<a href="https://natlawreview.com/article/new-york-ag-secures-over-5m-crypto-platform-alleged-promotion-fraudulent-investment" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">enquête du NY AG</a> a révélé qu'Uphold commercialisait le programme à haut rendement de Cred sans diligence raisonnable. Les investisseurs ont perdu des millions. Chez LedgerHound, nous avons déjà vu ce film. Des dizaines de cas où les plateformes privilégient le profit à la protection. Mais maintenant ? Les régulateurs ripostent enfin.</p>

      <h2 id="what-happened">Ce que dit réellement le règlement Uphold</h2>

      <p>Voici l'affaire. Uphold a promu Cred — une plateforme de prêt crypto promettant des rendements ridicules, comme 10 % d'intérêt sur les dépôts. Cred s'est avéré être un système de Ponzi. Effondré en 2020. Des milliers d'investisseurs laissés sans rien. Le NY AG a allégué qu'Uphold n'avait pas divulgué les risques matériels, y compris l'instabilité financière de Cred. Et ils ont continué à commercialiser Cred même après l'apparition de signaux d'alarme.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">5 M$+</p>
        <p className="text-sm text-slate-600">Le montant du règlement — plus de 5 millions de dollars — comprend des restitutions pour les investisseurs lésés et des pénalités. C'est l'une des plus grandes actions au niveau d'un État contre une plateforme crypto pour fraude de tiers.</p>
      </div>

      <p>Mais voici le hic : Uphold n'a pas créé l'arnaque. Ils l'ont juste promue. Et cela, selon le NY AG, est suffisant. La plateforme est désormais responsable des déclarations trompeuses et des omissions concernant la légitimité de Cred. Un changement majeur par rapport à la défense de « simple intermédiaire » sur laquelle les exchanges se sont historiquement appuyés.</p>

      <p>Dans notre travail d'enquête, nous voyons ce schéma tout le temps. Un client perd de l'argent sur une plateforme comme Cred, puis découvre que l'exchange qui l'a listée n'a fait aucune vérification. En utilisant notre <Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">vérificateur d'arnaque</Link>, nous pouvons souvent retracer les fonds vers un portefeuille signalé des mois plus tôt — mais l'exchange n'a jamais pris la peine de vérifier.</p>

      <h2 id="platform-liability">Responsabilité des plateformes : la nouvelle norme pour les exchanges crypto</h2>

      <p>Pendant des années, les plateformes crypto ont soutenu qu'elles n'étaient que des fournisseurs de technologie — pas des conseillers financiers. Le règlement Uphold brise ce récit. Si vous listez un produit, vous avez le devoir de l'examiner. Vous le commercialisez ? Divulguez les risques. C'est aussi simple que cela.</p>

      <p>Et ce n'est pas seulement Uphold. En 2025, la SEC a accusé un autre exchange d'avoir listé des titres non enregistrés. En 2026, le DOJ a signalé qu'il poursuivrait les plateformes facilitant le blanchiment d'argent — même si elles ne le savaient pas. La tendance est claire : les régulateurs attendent des plateformes qu'elles soient des gardiens, pas des tourniquets.</p>

      <h3>Ce que cela signifie pour les investisseurs</h3>

      <p>Si vous avez investi via une plateforme qui a promu une arnaque, vous pourriez avoir un recours légal. Le règlement Uphold établit un précédent : les plateformes peuvent être tenues responsables pour un marketing trompeur. Notre <Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">évaluation gratuite</Link> peut vous aider à évaluer si votre cas correspond.</p>

      <p>Mais n'attendez pas. Le délai de prescription pour la fraude en valeurs mobilières varie selon les États. À New York, il est généralement de six ans à compter de la découverte. Si vous avez perdu de l'argent avec Cred ou quelque chose de similaire, le temps presse.</p>

      <h2 id="cred-scam">L'arnaque Cred : une étude de cas sur les signaux d'alarme</h2>

      <p>Cred promettait jusqu'à 10 % de rendement sur les dépôts crypto. Ce taux aurait dû crier « trop beau pour être vrai ». Mais Uphold l'a commercialisé comme sûr et réglementé. Réalité : Cred perdait de l'argent. Son PDG a été inculpé pour fraude.</p>

      <p>Cela reflète l'<a href="https://malaysia.news.yahoo.com/robert-dunlap-sentenced-23-years-153051688.html" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">arnaque Meta 1 Coin</a>. Robert Dunlap a convaincu les investisseurs qu'il avait un jeton adossé à l'or garantissant 224 923 % de rendement. Il a été condamné à 23 ans de prison en 2026. Les deux cas montrent comment les escrocs utilisent des plateformes légitimes pour gagner en crédibilité.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">224 923 %</p>
        <p className="text-sm text-slate-600">C'est le rendement « garanti » que Dunlap a promis aux investisseurs de Meta 1 Coin. Il a volé 20 millions de dollars à 1 000 victimes. L'affaire Uphold montre que les plateformes qui permettent de tels mensonges peuvent être tenues responsables.</p>
      </div>

      <p>Dans nos enquêtes, nous recommandons d'utiliser <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">Wallet Tracker</Link> pour vérifier si les adresses de portefeuille d'une plateforme ont été signalées dans des arnaques passées. Une étape simple que les exchanges devraient faire — mais souvent ne font pas.</p>

      <h2 id="due-diligence">Ce que les exchanges doivent faire maintenant : une liste de contrôle de diligence raisonnable</h2>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Liste de contrôle de diligence raisonnable pour les exchanges
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Vérifier le statut réglementaire du produit</p>
            <p className="text-sm text-slate-600">Vérifiez si le produit est enregistré auprès de la SEC, de la CFTC ou des régulateurs d'État. Dans l'affaire Uphold, Cred n'était pas enregistré — pourtant Uphold l'a listé quand même.</p>
          <div className="not-prose ml-8 my-3 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">Conseil pro</p>
            <p className="text-xs text-slate-600">Utilisez la base de données EDGAR de la SEC pour vérifier les dépôts.</p>
          </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Auditer l'équipe derrière le produit</p>
            <p className="text-sm text-slate-600">Recherchez les antécédents des fondateurs. Les escrocs ont souvent des allégations de fraude antérieures ou des faillites. Une simple recherche Google peut révéler des signaux d'alarme.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Surveiller l'activité du portefeuille</p>
            <p className="text-sm text-slate-600">Utilisez l'analyse blockchain pour vérifier si les portefeuilles du produit déplacent des fonds vers des adresses d'arnaque connues. Notre <Link href={`${base}/graph-tracer`} className="text-brand-600 hover:underline">Graph Tracer</Link> peut aider à visualiser ces connexions.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Divulguer clairement tous les risques</p>
            <p className="text-sm text-slate-600">Ne cachez pas les risques dans les petits caractères. Affichez bien en évidence que les investissements ne sont pas assurés par la FDIC et peuvent perdre de la valeur.</p>
          </div>
        </div>
      </div>

      <p>Si vous êtes un investisseur, vous pouvez tenir les exchanges responsables en les signalant aux procureurs généraux des États. L'action du NY AG prouve que les régulateurs d'État sont prêts à agir. Déposez une plainte auprès du bureau de protection des consommateurs de votre État.</p>

      <h2 id="recovery">Comment récupérer des fonds après une arnaque liée à une plateforme</h2>

      <p>Si vous avez perdu de l'argent dans une arnaque promue par une plateforme, première étape : conservez les preuves. Prenez des captures d'écran des supports marketing, des relevés de transactions, de toute communication avec la plateforme. Ensuite, déposez un rapport auprès de l'IC3 du FBI et du procureur général de votre État.</p>

      <p>Ensuite, envisagez une enquête médico-légale. Notre <Link href={`${base}/report`} className="text-brand-600 hover:underline">rapport médico-légal automatisé</Link> (49 $) trace où vos fonds sont allés — révélant souvent qu'ils ont abouti sur un exchange KYC. C'est la preuve irréfutable pour un procès.</p>

      <p>Dans certains cas, la plateforme peut avoir des fonds séparés qui peuvent être gelés via une <Link href={`${base}/tools/exchange-letter`} className="text-brand-600 hover:underline">Lettre de préservation d'exchange</Link>. Nous fournissons un générateur gratuit pour cela. Mais agissez vite — les escrocs déplacent l'argent rapidement.</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">Besoin d'aide pour tracer vos fonds ?</h3>
        <p className="text-brand-100 text-sm mb-5">Notre équipe médico-légale a tracé plus de 10 millions de dollars de crypto volée. Commencez par une évaluation gratuite de votre dossier pour voir si nous pouvons vous aider.</p>
        <Link href={`${base}/free-evaluation`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          Obtenir une évaluation gratuite <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="regulatory-trends">Tendances réglementaires : ce qui s'en vient</h2>

      <p>Le règlement Uphold fait partie d'une répression plus large. En 2025, la SEC a augmenté les actions d'exécution contre les exchanges de 40 %. Le DOJ a formé un nouveau groupe de travail axé sur la fraude crypto. Et FinCEN du Trésor pousse à une conformité plus stricte à la Travel Rule.</p>

      <p>Mais la réglementation seule n'arrêtera pas les arnaques. Les plateformes ont besoin d'une surveillance en temps réel. Des outils comme notre <Link href={`${base}/scam-database`} className="text-brand-600 hover:underline">base de données d'arnaques</Link> permettent aux exchanges de vérifier les adresses de portefeuille par rapport aux indicateurs de fraude connus. C'est open source et gratuit.</p>

      <p>Pour les investisseurs, la leçon est claire : ne faites pas confiance à une plateforme simplement parce qu'elle est grande. Uphold était un exchange bien connu, pourtant il a promu une arnaque. Faites toujours vos propres recherches — et si quelque chose semble trop beau pour être vrai, c'est probablement le cas.</p>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Signaux d'alarme à surveiller
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Rendements irréalistes</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Promesses de rendements mensuels de 10 % ou plus</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Profits garantis sans risque</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Pression pour investir rapidement</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Manque de transparence</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Aucune information claire sur l'équipe</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Pas de rapports financiers audités</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Livres blancs vagues ou trompeurs</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Comportement de la plateforme</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>La plateforme approuve le produit sans avertissements</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Aucun avertissement sur les risques</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Difficulté à retirer des fonds</span></li>
          </ul>
        </div>
      </div>
    </>
  );
}
