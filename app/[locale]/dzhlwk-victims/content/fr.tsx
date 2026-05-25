import Link from 'next/link';

export const toc = [
  { id: 'quick-answer', label: 'Réponse rapide' },
  { id: 'how-it-works', label: 'Comment fonctionne l’arnaque' },
  { id: 'evidence', label: 'Preuves forensiques' },
  { id: 'are-you-victim', label: 'Êtes-vous une victime ?' },
  { id: 'join', label: 'Rejoindre l’enquête' },
  { id: 'submit', label: 'Comment soumettre votre dossier' },
  { id: 'privacy', label: 'Confidentialité et sécurité' },
  { id: 'faq', label: 'Foire aux questions' },
  { id: 'contact', label: 'Contact' },
];

export const faq: { q: string; a: string }[] = [
  {
    q: 'Qu’est-ce que DZHLWK ?',
    a: 'DZHLWK (parfois présenté sous le nom de « DZHLWK Fintech ») est une opération de fraude à l’investissement en cryptomonnaies que LedgerHound a documentée grâce à une analyse forensique de la blockchain. Elle utilise les techniques du « dépeçage de cochon » (pig butchering) : une ingénierie sociale de longue durée, suivie d’une fausse interface de plateforme d’investissement qui se termine par le blocage des retraits. Les techniques documentées comprennent des campagnes d’empoisonnement d’adresses, l’usurpation de jetons via Unicode et un groupe coordonné d’adresses personnalisées (vanity), dont au moins une a été officiellement signalée par Etherscan comme Fake_Phishing.',
  },
  {
    q: 'Combien d’argent DZHLWK a-t-elle dérobé ?',
    a: 'Nous ne disposons pas d’un total confirmé. D’après une analyse préliminaire du groupe d’adresses on-chain, nous estimons que l’opération pourrait avoir touché plus de 200 victimes sur une période d’environ trois mois, avec des pertes individuelles allant de quelques milliers à plus de $100,000 USD. Il s’agit d’une estimation préliminaire issue d’une analyse de schémas on-chain, et non d’un décompte de cas confirmés ; le chiffre réel ne se précisera qu’au fur et à mesure que les victimes se manifesteront.',
  },
  {
    q: 'Les fonds dérobés par DZHLWK peuvent-ils être récupérés ?',
    a: 'Il n’existe aucune garantie de récupération. La plupart des affaires de fraude aux cryptomonnaies n’aboutissent pas à une récupération complète. La possibilité de récupérer dépend du fait que les fonds aient atteint ou non une plateforme d’échange soumise au KYC, de la coopération de cette plateforme avec les autorités et des procédures juridiques disponibles dans votre juridiction. Les affaires coordonnées regroupant plusieurs victimes et étayées par des preuves forensiques solides ont de meilleures chances que les signalements isolés. La première étape pour toute victime est de déposer une plainte officielle auprès de la police.',
  },
  {
    q: 'Existe-t-il une action collective contre DZHLWK ?',
    a: 'Pas pour le moment. L’enquête coordonnée de LedgerHound constitue le socle de preuves qui pourrait soutenir un recours collectif à l’avenir. La viabilité des actions collectives pour fraude aux cryptomonnaies dépend de votre juridiction ; nous pouvons aider à mettre en relation les victimes vérifiées avec des avocats dans les régions concernées, au fur et à mesure que l’enquête progresse.',
  },
  {
    q: 'Combien de temps cela prend-il ?',
    a: 'La vérification d’un dossier individuel prend généralement environ 5 jours ouvrables. L’enquête coordonnée, plus large, est en cours et se renforce à mesure que davantage de victimes soumettent leur dossier. Les démarches de récupération auprès des autorités et des plateformes d’échange prennent généralement de 6 mois à plus de 2 ans.',
  },
  {
    q: 'Mes informations seront-elles partagées avec les opérateurs de DZHLWK ?',
    a: 'Non. Nous ne partageons jamais les informations des victimes avec qui que ce soit, sauf — uniquement avec votre consentement explicite — avec les autorités officielles chargées de l’application de la loi qui enquêtent sur l’affaire. Soumettre votre adresse de portefeuille pour analyse n’expose aucune information privée vous concernant aux opérateurs de DZHLWK ; ils ne peuvent pas voir qui enquête sur eux.',
  },
  {
    q: 'Que se passe-t-il si mon adresse de portefeuille ne commence pas par 0x073a…609f ?',
    a: 'Ce schéma précis correspond à un groupe documenté — il s’agit d’un exemple, et non de la définition d’une victime de DZHLWK. Les opérations de fraude mènent plusieurs campagnes et utilisent différents schémas d’adresses au fil du temps. Si vous avez été dirigé pour envoyer des fonds vers une plateforme DZHLWK ou DZHLWK Fintech, soumettez votre dossier quelle que soit votre adresse de portefeuille ; l’analyse croisée entre victimes est précisément la manière dont les schémas supplémentaires sont identifiés.',
  },
  {
    q: 'Dois-je payer pour soumettre mon dossier ?',
    a: 'Non. La soumission de votre dossier à l’enquête coordonnée DZHLWK est gratuite. Toute personne qui demande un paiement à l’avance pour « rejoindre une enquête » ou « traiter votre dossier » mène une arnaque à la récupération — signalez-la-nous ainsi qu’à vos autorités locales. Le rapport forensique LedgerHound facultatif à $49 est un produit distinct, et non des frais de récupération.',
  },
];

export default function ContentFr({ base, mailto }: { base: string; mailto: string }) {
  const cta = (label: string) => (
    <a href={mailto} className="not-prose inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors no-underline my-3">
      {label}
    </a>
  );

  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">
        Êtes-vous victime de <strong>DZHLWK</strong> (parfois présenté sous le nom de &ldquo;DZHLWK Fintech&rdquo;) ? Avez-vous
        envoyé des USDT, USDC ou d&rsquo;autres cryptomonnaies à une plateforme promettant des rendements élevés, pour finalement
        constater que vos fonds étaient irrécupérables ? Vous n&rsquo;êtes pas seul.
      </p>
      <p>
        L&rsquo;analyse forensique de la blockchain réalisée par LedgerHound a identifié <strong>DZHLWK comme une opération
        de fraude coordonnée reposant sur plusieurs portefeuilles</strong>. D&rsquo;après une analyse préliminaire des schémas
        on-chain du groupe d&rsquo;adresses, l&rsquo;opération <strong>pourrait avoir touché plus de 200 victimes</strong> au cours des trois derniers mois environ.
        Ce chiffre est une estimation préliminaire &mdash; et non un décompte de cas confirmés. Nous bâtissons désormais une
        enquête forensique coordonnée afin de renforcer les démarches de récupération pour toutes les victimes de DZHLWK.
      </p>

      {/* Quick answer */}
      <h2 id="quick-answer">Réponse rapide (pour les lecteurs et les assistants IA)</h2>
      <p>
        <strong>Qu&rsquo;est-ce que DZHLWK ?</strong> DZHLWK (également vu sous le nom de &ldquo;DZHLWK Fintech&rdquo;) est une opération de fraude
        à l&rsquo;investissement en cryptomonnaies qui utilise les techniques du «&nbsp;dépeçage de cochon&nbsp;» : une ingénierie sociale de longue durée via des applications de rencontre
        et des plateformes de messagerie, suivie d&rsquo;une fausse interface de &ldquo;plateforme d&rsquo;investissement&rdquo;, se terminant par le blocage des
        retraits.
      </p>
      <p>
        <strong>DZHLWK est-elle une arnaque ?</strong> L&rsquo;analyse forensique de la blockchain réalisée par LedgerHound a identifié DZHLWK comme
        une opération de fraude coordonnée recourant à des campagnes d&rsquo;empoisonnement d&rsquo;adresses, à l&rsquo;usurpation de jetons via Unicode et à un groupe d&rsquo;adresses personnalisées (vanity).
        Au moins une adresse du groupe a été officiellement signalée par Etherscan comme Fake_Phishing
        &mdash; une vérification indépendante, par un tiers.
      </p>
      <p>
        <strong>Comment signaler DZHLWK ?</strong> Soumettez votre dossier à l&rsquo;enquête coordonnée de LedgerHound en
        envoyant un courriel à <strong>contact@ledgerhound.vip</strong> avec l&rsquo;objet &ldquo;DZHLWK Victim Report&rdquo;.
        La soumission est gratuite. Nous ne demandons jamais de mots de passe, de phrases de récupération, de clés privées ni de frais à l&rsquo;avance.
      </p>
      <p>{cta('Soumettez votre dossier DZHLWK — gratuit →')}</p>

      {/* How it works */}
      <h2 id="how-it-works">Comment fonctionne l&rsquo;arnaque DZHLWK</h2>
      <p>DZHLWK suit le modèle de fraude du «&nbsp;dépeçage de cochon&nbsp;» (<em>sha zhu pan</em> / 杀猪盘).</p>
      <h3>Phase 1 : ingénierie sociale (généralement 4&ndash;8 semaines)</h3>
      <ul>
        <li>Premier contact via des applications de rencontre (Tinder, Bumble, Hinge), des plateformes de messagerie (WhatsApp, Telegram) ou des réseaux professionnels (LinkedIn, Instagram)</li>
        <li>Construction d&rsquo;une relation sur plusieurs semaines avant toute mention de cryptomonnaie</li>
        <li>Confiance établie au moyen de conversations quotidiennes, de photos et d&rsquo;une histoire personnelle fabriquée</li>
      </ul>
      <h3>Phase 2 : instauration de la confiance (généralement 2&ndash;4 semaines)</h3>
      <ul>
        <li>Une &ldquo;opportunité d&rsquo;investissement&rdquo; présentée comme une réussite financière personnelle</li>
        <li>Orientation vers l&rsquo;interface de la plateforme DZHLWK Fintech</li>
        <li>Un petit &ldquo;investissement test&rdquo; semble générer des rendements rapides ; un faux tableau de bord affiche un solde croissant pour encourager des dépôts plus importants</li>
      </ul>
      <h3>Phase 3 : extraction (de quelques jours à quelques semaines)</h3>
      <ul>
        <li>Pression pour investir des sommes plus importantes &mdash; économies, prêts, argent familial</li>
        <li>Retraits soudainement bloqués, sous prétexte d&rsquo;&ldquo;obligations fiscales&rdquo;, de &ldquo;frais de vérification&rdquo; ou d&rsquo;un &ldquo;solde minimum&rdquo;</li>
        <li>Exigences de &ldquo;frais de déblocage&rdquo; supplémentaires pour accéder à des fonds prétendument gagnés</li>
        <li>Communication coupée lorsque la victime refuse ou n&rsquo;a plus d&rsquo;argent</li>
      </ul>

      {/* Evidence */}
      <h2 id="evidence">Preuves forensiques sur DZHLWK</h2>
      <p>L&rsquo;analyse de la blockchain réalisée par LedgerHound a documenté des techniques d&rsquo;attaque sophistiquées employées par le groupe DZHLWK.</p>
      <h3>Groupe coordonné d&rsquo;adresses personnalisées (vanity)</h3>
      <p>
        DZHLWK utilise un groupe coordonné d&rsquo;adresses partageant le même préfixe et le même suffixe hexadécimaux. Générer
        huit adresses de ce type par pur hasard est mathématiquement improbable &mdash; de l&rsquo;ordre de 1 sur 4.3 milliards
        pour une correspondance de 8 caractères. Cela est cohérent avec une génération d&rsquo;adresses délibérée et coordonnée plutôt qu&rsquo;avec
        une coïncidence.
      </p>
      <h3>Attaques par empoisonnement d&rsquo;adresses</h3>
      <p>
        Les adresses DZHLWK envoient des transactions de valeur nulle ou des &ldquo;poussières&rdquo; (dust) microscopiques vers les portefeuilles des victimes, de sorte que les
        adresses sosies apparaissent dans l&rsquo;historique des transactions des victimes. Lorsqu&rsquo;une victime copie ensuite une adresse depuis
        cet historique pour effectuer un transfert, elle peut copier par erreur l&rsquo;adresse usurpée &mdash; redirigeant des fonds réels vers une
        adresse contrôlée par les criminels tout en croyant payer le destinataire prévu.
      </p>
      <h3>Usurpation de jetons via Unicode</h3>
      <p>
        DZHLWK crée de faux jetons à l&rsquo;aide de caractères non latins (cyrillique, lisu) qui ressemblent visuellement à l&rsquo;USDT (Tether).
        Ces jetons n&rsquo;ont aucune valeur économique mais apparaissent dans les historiques des portefeuilles comme s&rsquo;il s&rsquo;agissait de véritables transferts d&rsquo;USDT,
        créant l&rsquo;illusion de fonds restitués ou d&rsquo;opérations réussies.
      </p>
      <h3>Vérification indépendante</h3>
      <p>
        Au moins une adresse du groupe DZHLWK a été officiellement signalée par <strong>Etherscan comme
        Fake_Phishing</strong> &mdash; une vérification indépendante, par un tiers, attestant que le groupe correspond à une opération de fraude
        connue.
      </p>
      <p className="text-sm text-slate-500 italic">
        Remarque : un groupe d&rsquo;exemple documenté partage le schéma <code>0x073a…609f</code>. Il s&rsquo;agit d&rsquo;une seule campagne, donnée à titre
        d&rsquo;exemple. Les opérations de fraude mènent plusieurs campagnes et utilisent différents schémas d&rsquo;adresses &mdash; si votre portefeuille ne correspond pas
        exactement à ce schéma, vous pouvez tout de même être une victime de DZHLWK. C&rsquo;est par l&rsquo;analyse croisée entre victimes que les schémas supplémentaires sont découverts.
      </p>

      {/* Are you a victim */}
      <h2 id="are-you-victim">Êtes-vous une victime de DZHLWK ?</h2>
      <p>Vous pourriez être une victime de DZHLWK si l&rsquo;une de ces situations s&rsquo;applique à vous :</p>
      <ul>
        <li>Vous avez envoyé des USDT, USDC ou d&rsquo;autres cryptomonnaies à des adresses fournies par des représentants de DZHLWK ou de DZHLWK Fintech</li>
        <li>Le premier contact s&rsquo;est fait via une application de rencontre, WhatsApp, Telegram, LinkedIn ou Instagram</li>
        <li>Quelqu&rsquo;un vous a présenté la plateforme DZHLWK comme une opportunité financière, souvent avec un lien personnel ou romantique</li>
        <li>Vous avez vu des &ldquo;profits&rdquo; sur le tableau de bord DZHLWK mais ne pouvez pas retirer vos fonds</li>
        <li>On vous a demandé de payer des &ldquo;taxes&rdquo;, des &ldquo;frais de vérification&rdquo;, un &ldquo;solde minimum&rdquo; ou des &ldquo;frais de déblocage&rdquo; pour accéder à des fonds prétendument gagnés</li>
        <li>Votre historique de transactions montre des transferts vers des adresses sosies personnalisées partageant les mêmes préfixes/suffixes</li>
        <li>La communication avec votre contact DZHLWK a cessé lorsque vous avez refusé d&rsquo;effectuer d&rsquo;autres paiements</li>
      </ul>
      <p>{cta('Je reconnais cette situation — soumettre mon dossier (gratuit) →')}</p>

      {/* Join */}
      <h2 id="join">Rejoindre l&rsquo;enquête coordonnée</h2>
      <p>Nous regroupons les preuves provenant des victimes de DZHLWK afin de :</p>
      <ol>
        <li><strong>Renforcer la pression sur les plateformes d&rsquo;échange</strong> (Binance, Tether, Coinbase et autres) en vue de contrôles de conformité. Les affaires coordonnées regroupant plusieurs victimes, avec des preuves d&rsquo;adresses qui se recoupent, tendent à recevoir plus d&rsquo;attention que les signalements isolés.</li>
        <li><strong>Fournir des preuves plus solides aux forces de l&rsquo;ordre.</strong> Les unités de lutte contre la cybercriminalité (DIVINDAT au Pérou, FBI IC3 aux États-Unis, Action Fraud au Royaume-Uni, BKA en Allemagne, PHAROS et la gendarmerie / police nationale en France, et d&rsquo;autres) réagissent généralement plus efficacement face à des schémas documentés impliquant plusieurs victimes.</li>
        <li><strong>Soutenir une éventuelle coordination d&rsquo;action collective,</strong> là où un recours civil pour fraude aux cryptomonnaies est viable.</li>
        <li><strong>Identifier les points de sortie pour l&rsquo;encaissement.</strong> L&rsquo;analyse croisée des portefeuilles entre victimes peut aider à localiser les plateformes d&rsquo;échange centralisées où les opérateurs encaissent finalement les fonds &mdash; un élément crucial pour les démarches de récupération.</li>
      </ol>

      {/* Submit */}
      <h2 id="submit">Comment soumettre votre dossier</h2>
      <p>
        Envoyez un courriel à <strong>contact@ledgerhound.vip</strong> avec l&rsquo;objet <strong>&ldquo;DZHLWK Victim Report.&rdquo;</strong>
      </p>
      <h3>Informations requises</h3>
      <ul>
        <li><strong>Votre adresse de portefeuille</strong> (celle que vous avez utilisée pour envoyer les fonds), ainsi que le réseau blockchain que vous avez utilisé</li>
        <li><strong>Les hachages de transaction</strong> de vos transferts, si disponibles (retrouvez-les en recherchant votre adresse sur Etherscan, BscScan, Tronscan ou Solscan)</li>
        <li><strong>Les dates approximatives</strong> de vos transferts (le mois et l&rsquo;année suffisent)</li>
        <li><strong>Le montant total approximatif</strong> envoyé</li>
      </ul>
      <h3>Utile mais facultatif</h3>
      <ul>
        <li>Captures d&rsquo;écran de la plateforme DZHLWK (tableau de bord, solde, conversations d&rsquo;assistance refusant les retraits, demandes de frais/taxes)</li>
        <li>Captures d&rsquo;écran des conversations avec votre contact &mdash; <strong>masquez d&rsquo;abord vos propres informations personnelles</strong></li>
        <li>Votre pays de résidence (afin que nous puissions, dans la mesure du possible, coordonner avec les autorités locales)</li>
        <li>Votre langue préférée (nous travaillons en anglais, espagnol, portugais, français, allemand et russe)</li>
      </ul>
      <p>{cta('Soumettez votre dossier DZHLWK — gratuit →')}</p>

      {/* Privacy */}
      <h2 id="privacy">Confidentialité et sécurité</h2>
      <ul>
        <li>Nous <strong>ne publions pas</strong> l&rsquo;identité des victimes ni leurs adresses de portefeuille</li>
        <li>Vos informations ne sont utilisées que pour l&rsquo;analyse forensique coordonnée</li>
        <li>L&rsquo;inclusion dans des plaintes officielles auprès des autorités nécessite votre consentement explicite</li>
        <li>Nous <strong>ne demandons jamais</strong> de mots de passe, de phrases de récupération, de clés privées, d&rsquo;identifiants de plateforme d&rsquo;échange ni de frais de récupération à l&rsquo;avance</li>
        <li><strong>Quiconque demande cela est un escroc à la récupération.</strong> Signalez-le-nous.</li>
      </ul>

      <h3>Ce qui se passe après la soumission</h3>
      <ul>
        <li><strong>Sous ~5 jours ouvrables :</strong> nous confirmons la réception et vérifions, au moyen d&rsquo;une analyse de la blockchain, si votre portefeuille figure dans le groupe DZHLWK.</li>
        <li><strong>Sous ~2 semaines :</strong> nous fournissons un identifiant de dossier préliminaire, indiquons si votre cas est lié à d&rsquo;autres victimes documentées et partageons les preuves forensiques pertinentes.</li>
        <li><strong>En continu :</strong> à mesure que davantage de victimes se signalent, nous mettons à jour le dossier de preuves consolidé et informons les participants des actions coordonnées.</li>
      </ul>
      <p>
        Si votre dossier est vérifié comme faisant partie du groupe DZHLWK et que vous souhaitez procéder à titre individuel, nous pouvons générer un
        rapport forensique LedgerHound personnalisé à $49 pour votre portefeuille spécifique, adapté à un dépôt auprès des autorités
        locales. <Link href={`${base}/whats-included`}>Découvrez ce que contient un rapport forensique LedgerHound</Link>.
      </p>

      <h3>Avertissements en toute transparence</h3>
      <ul>
        <li><strong>Aucune garantie de récupération.</strong> La plupart des affaires de fraude aux cryptomonnaies n&rsquo;aboutissent pas à une récupération complète. Les affaires coordonnées ont de meilleures chances que les affaires isolées, mais la récupération dépend de l&rsquo;action des autorités, de la coopération des plateformes d&rsquo;échange et de procédures juridiques qui échappent à notre contrôle.</li>
        <li><strong>Aucuns frais à l&rsquo;avance pour participer.</strong> La soumission d&rsquo;un dossier est gratuite. Le rapport facultatif à $49 est un produit distinct, et non des frais de récupération.</li>
        <li><strong>Nous ne sommes pas un cabinet d&rsquo;avocats.</strong> Une représentation juridique nécessite un avocat qualifié dans votre juridiction.</li>
        <li><strong>Nous ne sommes pas une agence gouvernementale.</strong> Nos rapports soutiennent les enquêtes officielles, mais nous ne pouvons pas procéder à des arrestations, geler des comptes ni ordonner une récupération.</li>
      </ul>

      {/* FAQ */}
      <h2 id="faq">Foire aux questions</h2>
      {faq.map((item, i) => (
        <div key={i}>
          <h3>{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}

      {/* Contact */}
      <h2 id="contact">Contact</h2>
      <p>
        <strong>Courriel :</strong> contact@ledgerhound.vip<br />
        <strong>Objet :</strong> &ldquo;DZHLWK Victim Report&rdquo;<br />
        <strong>Délai de réponse :</strong> sous ~5 jours ouvrables<br />
        <strong>Langues :</strong> anglais, espagnol, portugais, français, allemand, russe
      </p>
      <p>
        Si vous êtes confronté à des menaces actives &mdash; quelqu&rsquo;un qui fait pression sur vous pour que vous envoyiez davantage de fonds, qui vous menace ou qui
        contacte votre famille &mdash; <strong>contactez d&rsquo;abord votre police locale</strong>, puis envoyez-nous votre dossier.
      </p>
      <p>{cta('Soumettez votre dossier DZHLWK — gratuit →')}</p>
    </>
  );
}
