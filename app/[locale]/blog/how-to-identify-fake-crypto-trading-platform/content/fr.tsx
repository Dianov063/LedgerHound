import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ContentFr({ base }: { base: string }) {
  return (
    <>
              {/* Intro */}
              <p className="text-lg text-slate-700 leading-relaxed">
                Vous avez trouvé une plateforme de trading crypto par l'intermédiaire d'une personne rencontrée en ligne. L'interface semble professionnelle. Votre compte affiche des rendements impressionnants. Vous avez même effectué un petit retrait qui a parfaitement fonctionné.
              </p>
              <p>
                Puis vous essayez de retirer vos vrais bénéfices — et tout s'arrête.
              </p>
              <p>
                C'est le moment déterminant de l'une des fraudes financières les plus sophistiquées de notre époque. Les fausses plateformes d'échange de cryptomonnaies sont devenues l'un des outils les plus efficaces utilisés par les réseaux de fraude organisés. Ces plateformes sont conçues pour paraître légitimes, imitant souvent de véritables plateformes d'échange et affichant des soldes de compte fabriqués pour créer l'illusion d'un trading actif et de profits constants.
              </p>
              <p>
                En 2026, ces plateformes sont plus convaincantes que jamais — et les enjeux n'ont jamais été aussi élevés.
              </p>

              {/* Scale */}
              <h2 id="scale">L'ampleur du problème</h2>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">17 milliards $</p>
                <p className="text-sm text-slate-600">
                  de pertes liées aux arnaques crypto en 2025, avec une augmentation de 1 400 % en glissement annuel des escroqueries par usurpation d'identité et ingénierie sociale basées sur l'IA.
                </p>
              </div>

              <p>
                Selon le rapport 2026 sur la criminalité crypto de TRM, environ 35 milliards de dollars ont été envoyés à des schémas frauduleux en 2025, les arnaques de type « pig butchering » représentant une part significative.
              </p>
              <p>
                Les fausses plateformes de trading sont au cœur de la plupart de ces pertes. Ce ne sont pas des escroqueries grossières et évidentes — ce sont des produits logiciels sophistiqués construits par des réseaux criminels organisés spécifiquement pour tromper.
              </p>

              {/* How they work */}
              <h2 id="how-they-work">Comment fonctionnent les fausses plateformes</h2>
              <p>
                Comprendre les mécanismes vous aide à les reconnaître avant qu'il ne soit trop tard.
              </p>

              <h3>Étape 1 : La prise de contact</h3>
              <p>
                Ces stratagèmes sont hautement coordonnés et commencent généralement par un contact non sollicité via des messages texte, les réseaux sociaux ou des applications de rencontres. Au fil du temps, les escrocs instaurent la confiance et introduisent progressivement des opportunités d'investissement en cryptomonnaies qui semblent crédibles et à faible risque.
              </p>
              <p>
                La plateforme n'est jamais la première chose qu'ils vous montrent. La relation vient en premier — parfois des semaines ou des mois de conversation quotidienne, d'intérêts partagés et de connexion émotionnelle.
              </p>

              <h3>Étape 2 : La démonstration de la plateforme</h3>
              <p>
                Une fois la confiance établie, votre contact propose de vous montrer comment il investit. Il vous guide vers une plateforme spécifique — une que vous n'avez jamais entendu parler, accessible via un lien qu'il vous envoie ou une application téléchargée en dehors des boutiques d'applications officielles.
              </p>
              <p>
                Les victimes sont souvent guidées étape par étape pour « apprendre » l'investissement crypto via de fausses applications de trading, des sites d'échange clonés ou des comptes de démonstration qui affichent des gains fabriqués.
              </p>

              <h3>Étape 3 : La preuve</h3>
              <p>
                Vous déposez un petit montant. Vous le regardez croître. Vous retirez un petit montant — et ça fonctionne. C'est fait exprès.
              </p>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">Par conception</p>
                <p className="text-sm text-slate-600">
                  Les soldes des comptes augmentent, les transactions semblent s'exécuter et de petits retraits sont autorisés pour renforcer l'illusion de légitimité. À mesure que la confiance grandit, les victimes sont encouragées à investir des montants plus importants.
                </p>
              </div>

              <h3>Étape 4 : Le piège</h3>
              <p>
                Lorsque vous tentez un retrait important, la plateforme génère un obstacle. Un blocage fiscal. Une vérification de conformité. Des « frais de liquidité ». Lorsque les victimes essaient de retirer, la plateforme ajoute des obstacles, exigeant des paiements supplémentaires présentés comme des taxes, des contrôles de conformité, des mises à niveau ou des frais de vérification — maintenant la victime en situation de payer tandis que les fonds sont détournés.
              </p>

              <h3>Étape 5 : La sortie</h3>
              <p>
                Une fois qu'ils ont extrait le maximum de fonds, la plateforme disparaît — ainsi que votre contact, son profil et tous les moyens de le joindre.
              </p>

              {/* Mid-article CTA */}
              <div className="not-prose my-10 bg-brand-50 border border-brand-200 rounded-xl p-6 text-center">
                <AlertTriangle className="mx-auto text-brand-600 mb-2" size={24} />
                <p className="font-display font-bold text-brand-800 mb-1">Vous pensez avoir affaire à une fausse plateforme ?</p>
                <p className="text-sm text-brand-600 mb-4">Obtenez une évaluation gratuite et confidentielle de votre dossier sous 24 heures. Sans engagement, sans frais initiaux.</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Obtenir une évaluation gratuite <ArrowRight size={14} />
                </Link>
              </div>

              {/* 10 Warning Signs */}
              <h2 id="warning-signs">10 signes d'alerte d'une fausse plateforme de trading crypto</h2>

              <h3>1. Vous y avez été dirigé par une personne rencontrée en ligne</h3>
              <p>
                Les plateformes légitimes n'ont pas besoin que quelqu'un vous recrute personnellement. Si une personne rencontrée en ligne — surtout quelqu'un qui semblait anormalement intéressé par votre situation financière — vous a dirigé vers une plateforme spécifique, considérez cela comme un signal d'alarme sérieux.
              </p>

              <h3>2. L'application n'est pas dans les boutiques officielles</h3>
              <p>
                Les véritables plateformes d'échange comme Coinbase, Kraken et Binance sont disponibles sur l'Apple App Store et Google Play avec des milliers d'avis vérifiés. Les fausses plateformes vous demandent généralement de :
              </p>
              <ul>
                <li>Télécharger un fichier APK directement depuis un lien</li>
                <li>Utiliser une application web sans référencement en boutique</li>
                <li>Installer une « version spéciale » pour de meilleurs rendements</li>
              </ul>

              <h3>3. L'URL semble presque correcte</h3>
              <p>
                Les fraudeurs enregistrent des noms de domaine qui imitent de près les plateformes d'échange légitimes. Les tactiques courantes incluent :
              </p>
              <ul>
                <li>Ajouter des mots : <code>coinbase-pro-trading.com</code></li>
                <li>Changer les extensions : <code>binance.cc</code> au lieu de <code>binance.com</code></li>
                <li>Utiliser des tirets : <code>kraken-exchange.net</code></li>
              </ul>
              <p>
                Vérifiez toujours l'URL exacte par rapport au site officiel. Ajoutez directement les plateformes légitimes à vos favoris.
              </p>

              <h3>4. Les rendements sont garantis ou constamment élevés</h3>
              <p>
                Aucun investissement légitime ne garantit de rendements. Lorsque vous entendez parler de rendements « garantis » sur les cryptomonnaies, vous avez probablement affaire à un individu ou une entreprise peu fiable, selon la Federal Trade Commission.
              </p>
              <p>
                Les fausses plateformes affichent généralement des rendements de 10 à 40 % par mois — des chiffres impossibles à maintenir sur les marchés réels.
              </p>

              <h3>5. Les retraits nécessitent des paiements supplémentaires</h3>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <p className="text-xl font-display font-bold text-red-900 mb-2">L'indicateur n°1 d'une arnaque</p>
                <p className="text-sm text-red-700">
                  Les demandes de « frais » ou de « paiements de vérification » supplémentaires ne donnent jamais accès au compte. Chaque paiement mène à de nouvelles excuses, augmentant les pertes alors que les victimes tentent de récupérer leurs dépôts.
                </p>
              </div>

              <p>
                Les plateformes d'échange légitimes ne vous demandent <strong>jamais</strong> de déposer plus d'argent pour retirer vos fonds existants. Si vous rencontrez l'un de ces cas :
              </p>
              <ul>
                <li>« Paiement d'impôts requis pour débloquer les fonds »</li>
                <li>« Frais de vérification de conformité »</li>
                <li>« Dépôt de liquidité pour traiter le retrait »</li>
                <li>« Frais de vérification anti-blanchiment »</li>
              </ul>
              <p>
                <strong>Vous êtes victime d'une arnaque. Arrêtez immédiatement tous les paiements.</strong>
              </p>

              <h3>6. Le service client uniquement par chat</h3>
              <p>
                Les fausses plateformes n'ont généralement pas de numéro de téléphone, pas d'adresse physique, pas d'immatriculation d'entreprise vérifiable — le support uniquement via le chat intégré à la plateforme ou Telegram. Les vraies plateformes d'échange ont une immatriculation d'entreprise vérifiable, des adresses publiées et plusieurs canaux de contact.
              </p>

              <h3>7. La plateforme est introuvable dans les bases de données du secteur</h3>
              <p>
                Vérifiez la plateforme dans :
              </p>
              <ul>
                <li><strong>CoinGecko</strong> et <strong>CoinMarketCap</strong> — les plateformes légitimes y sont répertoriées</li>
                <li><strong>DFPI Scam Tracker</strong> (California Department of Financial Protection)</li>
                <li><strong>FCA Register</strong> (UK Financial Conduct Authority)</li>
                <li><strong>FINRA BrokerCheck</strong> (US)</li>
              </ul>
              <p>
                Si la plateforme n'apparaît dans aucune base de données réglementaire, ce n'est pas un service financier enregistré.
              </p>

              <h3>8. Profils générés par IA et deepfakes</h3>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">4,5x plus d'argent</p>
                <p className="text-sm text-slate-600">
                  extrait par opération par les arnaques assistées par l'IA par rapport aux arnaques traditionnelles. En 2026, la personne qui vous a présenté la plateforme pourrait ne pas être humaine du tout.
                </p>
              </div>

              <p>
                Signes d'alerte de personas générées par l'IA :
              </p>
              <ul>
                <li>Photos de profil qui semblent légèrement artificielles (visages générés par IA)</li>
                <li>Appels vidéo préenregistrés ou utilisant la technologie deepfake</li>
                <li>Conversation scriptée qui semble légèrement décalée</li>
                <li>Refus de faire une vidéo en direct spontanée</li>
              </ul>

              <h3>9. Pression pour investir davantage</h3>
              <p>
                Les conseillers en investissement légitimes ne vous mettent pas la pression. Les opérateurs de fausses plateformes créent l'urgence :
              </p>
              <ul>
                <li>« Cette fenêtre de trading se ferme dans 48 heures »</li>
                <li>« Vous allez manquer la hausse si vous n'ajoutez pas de fonds maintenant »</li>
                <li>« J'investis 50 000 $ — vous devriez en faire autant »</li>
              </ul>
              <p>
                Cette pression psychologique est conçue pour court-circuiter votre jugement rationnel.
              </p>

              <h3>10. Aucun historique de transactions traçable</h3>
              <p>
                Lorsque vous envoyez des cryptomonnaies à une fausse plateforme, elles partent immédiatement. Sur une vraie plateforme d'échange, vos fonds restent sur votre compte.
              </p>
              <p>
                Vous pouvez le vérifier : utilisez notre <Link href={`${base}/wallet-tracker`} className="text-brand-600 font-semibold hover:underline">Wallet Tracker</Link> gratuit pour vérifier l'adresse de destination. Si les fonds transférés vers le portefeuille de la plateforme ont immédiatement été déplacés vers d'autres adresses au lieu de rester dans une réserve de plateforme, vous avez affaire à une arnaque.
              </p>

              {/* Technical Red Flags */}
              <h2 id="technical-red-flags">Signaux d'alerte techniques</h2>
              <p>
                Pour ceux à l'aise avec l'analyse blockchain :
              </p>
              <p>
                <strong>Vérifiez l'adresse du portefeuille on-chain.</strong> Les plateformes d'échange légitimes maintiennent de grands portefeuilles de réserve avec des milliers de transactions sur plusieurs années. Les portefeuilles d'arnaque présentent généralement :
              </p>
              <ul>
                <li>Une création récente (il y a quelques jours ou semaines)</li>
                <li>Un schéma de réception de fonds immédiatement transférés</li>
                <li>Aucun historique de transactions à long terme</li>
              </ul>
              <p>
                <strong>Utilisez notre <Link href={`${base}/scam-checker`} className="text-brand-600 font-semibold hover:underline">Scam Checker</Link> gratuit.</strong> Nous maintenons une base de données d'adresses frauduleuses connues, croisées avec les signalements Chainabuse et les listes de sanctions OFAC.
              </p>
              <p>
                <strong>Recherchez l'identification de la plateforme d'échange.</strong> Analysez l'adresse de destination avec notre <Link href={`${base}/graph-tracer`} className="text-brand-600 font-semibold hover:underline">Graph Tracer</Link>. Si les fonds transitent immédiatement vers des mixeurs de confidentialité ou des plateformes offshore non réglementées plutôt que vers de grandes plateformes conformes KYC, c'est un indicateur fort de fraude.
              </p>

              {/* Real Case */}
              <h2 id="real-case">Cas réel : un homme de Géorgie perd 164 000 $</h2>
              <p>
                Un homme de Géorgie a rencontré une femme se faisant appeler « Hnin Phyu » sur Facebook en juin 2025. Elle a rapidement déplacé leur conversation vers Telegram et l'a initié à l'investissement en cryptomonnaies. Il lui a fait confiance et a suivi ses instructions pour créer des comptes sur Crypto.com et un service de portefeuille numérique avant de transférer son argent vers un faux site de trading qui affichait des profits fabriqués.
              </p>
              <p>
                Lorsqu'il a essayé de retirer son argent, les escrocs lui ont dit qu'il devait payer 50 000 $ supplémentaires en taxes et frais pour débloquer ses fonds. Les pertes totales ont dépassé 164 000 $.
              </p>
              <p>
                L'<strong>Operation Silent Freeze</strong> du FBI, lancée en octobre 2025, cible spécifiquement les schémas de fraude aux cryptomonnaies — mais la prévention reste bien plus efficace que la récupération.
              </p>

              {/* If already sent money */}
              <h2 id="already-sent">Si vous avez déjà envoyé de l'argent</h2>

              <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <p className="text-xl font-display font-bold text-red-900 mb-2">Arrêtez immédiatement</p>
                <p className="text-sm text-red-700">
                  N'envoyez aucun fonds supplémentaire, quoi qu'on vous dise. Chaque paiement supplémentaire va directement aux escrocs.
                </p>
              </div>

              <p>
                <strong>Conservez toutes les preuves :</strong>
              </p>
              <ul>
                <li>Captures d'écran de la plateforme et de votre solde de compte</li>
                <li>Toutes les conversations avec la personne qui vous a mis en contact</li>
                <li>Les relevés de transactions et les adresses de portefeuille</li>
                <li>L'URL de la plateforme et tous les identifiants de compte</li>
              </ul>

              <p>
                <strong>Signalez immédiatement :</strong>
              </p>
              <ul>
                <li>FBI IC3 sur <strong>ic3.gov</strong> (incluez toutes les adresses de portefeuille)</li>
                <li>FTC sur <strong>reportfraud.ftc.gov</strong></li>
                <li>Le procureur général de votre État</li>
              </ul>

              <p>
                <strong>Faites réaliser une investigation forensique blockchain.</strong> Les données montrent que le gel des actifs a constitué la meilleure mesure pour aider à stopper les pertes. Dans de nombreux cas où les fonds étaient encore sous le contrôle du portefeuille de l'attaquant, environ 75 % des actifs ont été gelés avec succès.
              </p>
              <p>
                Le temps est crucial. Chaque heure qui passe, les fonds se déplacent plus loin dans la blockchain et deviennent plus difficiles à tracer et à geler.
              </p>

              {/* Getting Help */}
              <h2 id="getting-help">Obtenir de l'aide</h2>
              <p>
                Si vous avez été victime d'une fausse plateforme de trading, <strong>LedgerHound</strong> fournit des investigations forensiques blockchain certifiées.
              </p>

              <div className="not-prose my-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
                <p className="font-display font-bold text-slate-900 mb-4">Nous allons :</p>
                <div className="space-y-3">
                  {[
                    'Tracer vos fonds sur toutes les principales blockchains',
                    'Identifier quelles plateformes d\'échange ont reçu les cryptomonnaies volées',
                    'Produire un rapport forensique prêt pour le tribunal documentant le flux complet des fonds',
                    'Accompagner la procédure de citation à comparaître de votre avocat',
                    'Fournir des consultations en russe, anglais, espagnol, chinois, français et arabe',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-brand-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p>
                <Link href={`${base}/free-evaluation`} className="text-brand-600 font-bold hover:underline">
                  Obtenez votre évaluation gratuite de dossier →
                </Link>
              </p>
              <p>
                Gratuit. Confidentiel. Sans engagement. Réponse sous 24 heures.
              </p>
    </>
  );
}
