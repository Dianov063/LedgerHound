import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentEs({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">El 14 de abril de 2026, OFAC lanzó una bomba: dos casinos mexicanos — Casino Centenario y Casino Caballo — más tres individuos, sancionados por lavar dinero para el Cártel del Noreste (CDN). Esto no fue solo otra sanción rutinaria. Es una ventana cristalina a cómo los negocios tradicionales de efectivo están ahora cerrando la brecha entre el dinero físico de las drogas y las criptomonedas. Cosas desagradables.</p>
      <p className="text-lg text-slate-700 leading-relaxed">Vemos este patrón a menudo en LedgerHound. Los cárteles usan casinos no solo para lavar efectivo — lo convierten en criptomonedas, especialmente stablecoins, y luego mueven esos fondos a través de fronteras al instante. El <a href="https://home.treasury.gov/news/press-releases/sb0440" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">comunicado de prensa del Tesoro</a> confirma que el CDN opera una "empresa de lavado de dinero y contrabando de efectivo" que abarca tanto activos tradicionales como digitales. Aquí está la mecánica, y por qué la forense blockchain es la única herramienta que puede seguir el rastro.</p>

      <h2 id="the-casino-crypto-gateway">La puerta de enlace casino-cripto</h2>

      <p>Los casinos siempre han sido el mejor amigo de un lavador de dinero. Entras con efectivo sucio, compras fichas, apuestas un poco, sales con un cheque — o en los casinos modernos, un retiro en cripto. La operación del CDN, según OFAC, implicaba contrabando de efectivo a granel desde EE.UU. hacia México, luego canalizado a través de casinos. Pero aquí está el giro: una vez dentro de ese sistema de casino, el efectivo se convierte en Tether (USDT) u otras stablecoins en exchanges que se asocian con el casino.</p>

      <p>Desde una perspectiva de cripto-forense, el momento crítico es el "on-ramp" — cuando el fiat se convierte en cripto. Los casinos que ofrecen servicios cripto crean un punto de ofuscación perfecto. A diferencia de un exchange tradicional que exige KYC, un casino puede procesar efectivo y emitir cripto a una billetera que parece limpia. Nuestro <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">Wallet Tracker</Link> puede detectar tales billeteras analizando patrones de transacciones — alta frecuencia, depósitos de números redondos, movimientos rápidos entre cadenas.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">$15B+</p>
        <p className="text-sm text-slate-600">estimación anual de lavado de dinero a través de casinos a nivel mundial, según el GAFI. Los casinos sancionados del CDN son solo una fracción de esto.</p>
      </div>

      <h2 id="ofac-sanctions-and-blockchain-tracing">Sanciones de OFAC como herramienta de rastreo</h2>

      <p>Cuando OFAC sanciona a una entidad como Casino Centenario, no solo congela activos — crea un efecto dominó. Cada institución financiera, incluidos los exchanges de cripto, está ahora legalmente obligada a bloquear transacciones que involucren a ese casino. Eso significa que cualquier USDT que haya tocado esos casinos ahora está "contaminado" y puede ser marcado. En nuestro trabajo de casos, usamos las listas de sanciones de OFAC como punto de partida: una vez que identificamos una dirección sancionada, rastreamos hacia atrás para encontrar la fuente de los fondos.</p>

      <p>La <a href="https://home.treasury.gov/news/press-releases/sb0440" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">designación del Tesoro</a> del CDN como Organización Terrorista Extranjera en 2025 agrega otra capa. Bajo la Orden Ejecutiva 13224, cualquier persona o entidad que brinde apoyo al CDN — incluso a través de cripto — puede ser sancionada. Esto ha llevado a un aumento en las solicitudes de víctimas de estafas de sacrificio de cerdos que, sin saberlo, enviaron fondos a billeteras que luego interactuaron con casinos sancionados. Nuestro <Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">Scam Checker</Link> puede cotejar direcciones de billeteras contra la lista SDN de OFAC en tiempo real.</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">Verifique si una billetera está vinculada a entidades sancionadas</h3>
        <p className="text-brand-100 text-sm mb-5">Use nuestro Scam Checker gratuito para ver si una dirección cripto ha sido marcada por OFAC o reportada en estafas.</p>
        <Link href={`${base}/scam-checker`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          Realice una verificación gratuita <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="how-cartels-use-casinos-for-crypto-laundering">Cómo los cárteles usan los casinos para el lavado de cripto</h2>

      <h3>Paso 1: Contrabando de efectivo</h3>

      <p>Según el <a href="https://nypost.com/2026/04/14/us-news/us-sanctions-2-mexican-casinos-over-alleged-ties-to-countrys-northeast-cartel/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">informe del New York Post</a>, los operativos del CDN contrabandean efectivo a granel desde EE.UU. hacia México, a menudo escondido en vehículos. Luego, el efectivo llega a casinos como Casino Centenario en Nuevo Laredo.</p>

      <h3>Paso 2: Conversión en el casino</h3>

      <p>El casino acepta el efectivo y emite fichas o créditos. En lugar de apostar, el cártel puede usar el socio de intercambio de cripto del casino para convertir esos créditos en USDT o Bitcoin. Este paso a menudo ocurre a través de mesas OTC (over-the-counter) operadas por el casino.</p>

      <h3>Paso 3: Ofuscación entre cadenas</h3>

      <p>Una vez en cripto, los fondos se mueven a través de múltiples blockchains — de TRC20 a ERC20 a BEP20 — para ocultar el rastro. Nuestro <Link href={`${base}/graph-tracer`} className="text-brand-600 hover:underline">Graph Tracer</Link> puede visualizar estos saltos entre cadenas, pero requiere análisis de tiempo para detectar los intercambios. En un caso, rastreamos fondos que fueron de una billetera vinculada a un casino a un DEX, luego a una billetera de privacidad, y finalmente a un exchange con KYC en la UE.</p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Si sospecha de lavado vinculado a casinos
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Identifique la dirección del casino</p>
            <p className="text-sm text-slate-600">Verifique si la billetera que está investigando ha interactuado con alguna dirección de depósito de casino conocida. Use nuestro Scam Checker para buscar entidades vinculadas a OFAC.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Rastree movimientos entre cadenas</p>
            <p className="text-sm text-slate-600">Use nuestro Graph Tracer para seguir los fondos a través de las redes TRC20, ERC20 y BEP20. Busque conversiones rápidas que sugieran ofuscación intencional.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Genere un informe forense</p>
            <p className="text-sm text-slate-600">Nuestro informe automatizado compila la cadena de custodia y marca cualquier dirección sancionada. Está listo para el tribunal y puede usarse para presentar una queja.</p>
          </div>
        </div>
      </div>

      <h2 id="why-casinos-are-perfect-for-cartel-crypto">Por qué los casinos son perfectos para el cripto de los cárteles</h2>

      <p>Los casinos ofrecen tres cosas que los cárteles necesitan: alto volumen de efectivo, escrutinio mínimo y acceso a cripto. A diferencia de los bancos, en muchas jurisdicciones los casinos no están obligados a reportar transacciones menores de $10,000. E incluso cuando presentan Informes de Transacciones en Efectivo (CTR), la información rara vez lleva a direcciones de blockchain.</p>

      <p>El <a href="https://www.greenwichtime.com/news/world/article/us-sanctions-2-casinos-and-3-persons-over-alleged-22206577.php" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">artículo de Greenwich Time</a> señala que los individuos sancionados incluyen gerentes de casino y correos de efectivo. Eso nos dice que el cártel tiene operativos incrustados dentro de los propios casinos. Por nuestra experiencia, dicho acceso interno les permite eludir incluso los controles AML básicos.</p>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} /> Lavado en casinos (tradicional)
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Efectivo → Fichas → Efectivo (cheque)</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Movimiento lento y físico</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Requiere colusión del personal del casino</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Rastreable mediante vigilancia</span></li>
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Lavado casino-cripto
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Efectivo → Casino → USDT → Múltiples cadenas</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Transferencia global instantánea</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Insider + exploits de contratos inteligentes</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Rastreable solo con forense blockchain</span></li>
          </ul>
        </div>
      </div>

      <h2 id="what-this-means-for-scam-victims">Qué significa esto para las víctimas de estafas</h2>

      <p>Si ha sido estafado y sus fondos fueron a una billetera que luego tocó una dirección vinculada a un casino, la recuperación es más difícil pero no imposible. Las sanciones de OFAC significan que cualquier USDT en poder de esos casinos está congelado en exchanges compatibles como Binance o Kraken. Pero es probable que el cártel haya movido los fondos antes de que las sanciones entraran en vigor.</p>

      <p>En nuestro trabajo en LedgerHound, hemos recuperado fondos presentando cartas de preservación con exchanges que recibieron el cripto lavado. La velocidad lo es todo: el <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">Emergency Preservation Pack</Link> envía avisos legales simultáneos a hasta 10 exchanges, congelando los fondos antes de que puedan ser retirados. Hemos visto éxito cuando las víctimas actuaron dentro de las 48 horas.</p>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Crítico: No confíe en los casinos para obtener ayuda
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Los casinos no son sus aliados</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Los casinos sancionados no cooperarán con las víctimas</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Pueden destruir registros una vez que se enteren de una investigación</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Su mejor opción es rastrear el cripto hasta un exchange regulado</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Qué hacer de inmediato</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Documente cada hash de transacción y dirección de billetera</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Realice una verificación gratuita de estafas en nuestro sitio para ver si alguna dirección está marcada</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Contacte a un abogado con licencia en su jurisdicción</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Use nuestro Generador de Cartas de Preservación de Exchange para congelar fondos en exchanges</span></li>
          </ul>
        </div>
      </div>

      <h2 id="the-future-of-cartel-crypto-laundering">El futuro del lavado de cripto de los cárteles</h2>

      <p>Las sanciones a los casinos del CDN son una señal de lo que está por venir. A medida que más casinos adopten servicios cripto, se convierten en objetivos principales para el lavado de dinero. Los reguladores están contraatacando: la regla propuesta por FinCEN sobre informes de cripto en casinos, esperada para finales de 2026, requeriría que los casinos traten las transacciones cripto como transacciones en efectivo.</p>

      <p>Pero desde un punto de vista forense, el blockchain nunca miente. Cada transacción está registrada. El desafío es conectar los puntos entre el efectivo del casino y las billeteras cripto. Ahí es donde entra nuestra experiencia. Hemos desarrollado algoritmos que detectan patrones de transacciones vinculados a casinos — como depósitos de números redondos seguidos de múltiples retiros pequeños — que indican estratificación.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">6</p>
        <p className="text-sm text-slate-600">objetivos sancionados por OFAC en la acción de abril de 2026: 2 casinos y 3 individuos (más una entidad sin nombre). La investigación está en curso.</p>
      </div>

      <p>Si es víctima de una estafa que puede involucrar lavado en casinos, no espere. Cuanto más espere, más capas agregará el cártel. <Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">Obtenga una evaluación gratuita</Link> de su caso hoy.</p>
    </>
  );
}
