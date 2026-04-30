import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentEs({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">Kyle Holder pensó que estaba hablando con una persona real llamada Niamh. Dos meses de conversaciones. Un falso "equipo de servicio al cliente" la entrenó sobre billeteras y transferencias. Cuando se dio cuenta, sus ahorros habían desaparecido, desviados a través de capas de transacciones blockchain. Esta no es una historia aislada. Es la nueva cara del fraude cripto, y está impulsada por inteligencia artificial.</p>
      <p className="text-lg text-slate-700 leading-relaxed">Las cifras son asombrosas. Según el <a href="https://gizmodo.com/crypto-investment-scams-were-the-most-costly-type-of-fraud-in-the-u-s-in-2025-2000743099" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">informe IC3 2025 del FBI</a>, los estadounidenses perdieron $7.2 mil millones en estafas de inversión en cripto en 2025, convirtiéndolo en el tipo de fraude más costoso reportado a la agencia. Y los investigadores del IRS dicen que la IA es un factor clave. En un <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">reporte de CBS News</a>, funcionarios revelaron cómo las voces deepfake, los perfiles generados por IA y los guiones de chat automatizados hacen que las estafas sean más convincentes que nunca.</p>
      <p className="text-lg text-slate-700 leading-relaxed">Este artículo desglosa cómo la IA está potenciando el fraude cripto, qué están viendo los investigadores del IRS sobre el terreno y, lo más importante, cómo puedes contraatacar usando forense blockchain y herramientas gratuitas como el <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">Rastreador de Billeteras de LedgerHound</Link>.</p>

      <h2 id="the-ai-powered-scam-machine">La Máquina de Estafas Impulsada por IA</h2>

      <p>Los estafadores siempre han sido buenos en la manipulación. Pero la IA les da escala. En lugar de un estafador escribiendo mensajes, los chatbots de IA ahora ejecutan miles de conversaciones simultáneamente, adaptándose en tiempo real a las respuestas de las víctimas. Los investigadores del IRS dijeron a <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS News</a> que estos bots pueden imitar empatía, urgencia e incluso interés romántico, todo mientras recopilan datos personales para refinar el ataque.</p>

      <p>Las llamadas de voz y video deepfake son la próxima frontera. En 2025, el FBI advirtió sobre estafadores que usan voces clonadas por IA de familiares o figuras de autoridad para exigir pagos urgentes en cripto. La tecnología es barata y accesible: una muestra de audio de 30 segundos de redes sociales es suficiente para clonar una voz. Hemos visto casos en los que las víctimas recibieron una "videollamada" de lo que parecía un agente de soporte de un exchange de confianza, solo para perder toda su cartera.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">$7.2 mil millones</p>
        <p className="text-sm text-slate-600">Pérdidas totales por estafas de inversión en cripto reportadas al FBI IC3 en 2025, la más alta de cualquier categoría de fraude.</p>
      </div>

      <p>¿El resultado? Pérdidas récord de $7.2 mil millones solo por estafas de inversión en cripto, según el <a href="https://gizmodo.com/crypto-investment-scams-were-the-most-costly-type-of-fraud-in-the-u-s-in-2025-2000743099" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">informe IC3 2025 del FBI</a>. Eso sin contar estafas románticas, ransomware o compromiso de correo electrónico empresarial, todos los cuales exigen cada vez más cripto.</p>

      <h2 id="irs-investigators-on-the-front-lines">Investigadores del IRS en Primera Línea</h2>

      <p>La unidad de Investigación Criminal del IRS (IRS-CI) está en una posición única para abordar el fraude cripto porque el lavado de dinero casi siempre deja un rastro fiscal. En 2025, los agentes de IRS-CI investigaron cientos de casos relacionados con cripto, muchos de ellos con identidades falsas generadas por IA y empresas fantasma. Según <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS News</a>, la agencia ha visto un fuerte aumento en casos donde los estafadores usan IA para crear plataformas de inversión realistas que existen solo en papel.</p>

      <p>Un agente del IRS describió un caso en el que una víctima fue atraída a un grupo de minería falso que prometía rendimientos diarios. El sitio web se veía profesional, completo con testimonios generados por IA y un chatbot en vivo que respondía preguntas 24/7. Cuando la víctima intentó retirar, el bot exigió "tarifas de verificación" adicionales, una táctica clásica de pig butchering, ahora automatizada.</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">¿Crees que te han estafado?</h3>
        <p className="text-brand-100 text-sm mb-5">No esperes. Las primeras 72 horas son críticas para congelar fondos en exchanges. Usa nuestro Rastreador de Billeteras gratuito para mapear el flujo de tu cripto robado, sin necesidad de cuenta.</p>
        <Link href={`${base}/wallet-tracker`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          Prueba el Rastreador de Billeteras Gratis <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="how-ai-enables-pig-butchering-at-scale">Cómo la IA Permite el Pig Butchering a Escala</h2>

      <p>El pig butchering, una estafa donde los defraudadores construyen confianza durante semanas o meses antes de vaciar a las víctimas, existe desde hace años. Pero la IA lo potencia. En lugar de un estafador manejando un puñado de víctimas, la IA puede ejecutar docenas de "relaciones" simultáneamente, usando procesamiento de lenguaje natural para recordar conversaciones pasadas y ajustar tácticas.</p>

      <p>Las <a href="https://www.jpost.com/international/article-894049" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">sanciones del Tesoro de EE. UU. contra el senador camboyano Kok An</a> y otras 28 personas en 2026 expusieron una enorme red de centros de estafas que usaban IA para atacar a estadounidenses. Estas operaciones empleaban videollamadas deepfake, mensajes de voz generados por IA e incluso noticias falsas para hacer que sus esquemas parecieran legítimos. El Departamento del Tesoro alegó que Kok An usó conexiones políticas para proteger estos centros, que robaron millones de ciudadanos estadounidenses.</p>

      <ul>
        <li>Chatbots de IA que imitan parejas románticas o asesores financieros</li>
        <li>Videollamadas deepfake con falsos "agentes de soporte"</li>
        <li>Noticias falsas y testimonios generados por IA para generar credibilidad</li>
        <li>Plataformas de trading automatizadas que muestran ganancias falsas</li>
      </ul>

      <h2 id="the-role-of-blockchain-forensics">El Papel de la Forense Blockchain</h2>

      <p>La IA puede ayudar a los estafadores, pero la forense blockchain se está poniendo al día. Cada transacción cripto se registra permanentemente en el libro mayor. Incluso cuando los fondos pasan por mezcladores o puentes entre cadenas, las herramientas forenses pueden rastrear el flujo, si actúas rápido.</p>

      <p>En LedgerHound, hemos rastreado fondos robados de estafas con IA a través de múltiples blockchains, incluyendo Bitcoin, Ethereum y USDT en TRC20. En un caso, una víctima perdió $47,000 en una llamada de "soporte de exchange" deepfake. Nuestro análisis mostró que los fondos se movieron a través de tres cadenas en menos de una hora, llegando a un exchange con KYC. Ayudamos a congelar la cuenta antes de que el estafador pudiera retirar.</p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Pasos Inmediatos Si Has Sido Estafado
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Detén toda comunicación</p>
            <p className="text-sm text-slate-600">No sigas interactuando. Los estafadores pueden intentar extraer más dinero o información personal.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Documenta todo</p>
            <p className="text-sm text-slate-600">Guarda capturas de pantalla, direcciones de billeteras, IDs de transacciones y cualquier mensaje. Esto es evidencia.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Usa un rastreador de billeteras</p>
            <p className="text-sm text-slate-600">Ingresa la dirección de la billetera del estafador en nuestro <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">Rastreador de Billeteras gratuito</Link> para ver a dónde fueron los fondos.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Reporta a las autoridades</p>
            <p className="text-sm text-slate-600">Presenta un informe ante el <a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">FBI IC3</a> y a las autoridades locales. También notifica al exchange donde llegaron los fondos.</p>
          <div className="not-prose ml-8 my-3 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">Consejo profesional</p>
            <p className="text-xs text-slate-600">Muchos exchanges congelan cuentas solo después de recibir una carta de preservación. Usa nuestro <Link href={`${base}/tools/exchange-letter`} className="text-brand-600 hover:underline">Generador de Cartas de Preservación para Exchanges</Link> de forma gratuita.</p>
          </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">5</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Considera el rastreo profesional</p>
            <p className="text-sm text-slate-600">Si la cantidad es significativa, un <Link href={`${base}/report`} className="text-brand-600 hover:underline">informe forense</Link> puede proporcionar una cadena de custodia lista para el tribunal para esfuerzos de recuperación.</p>
          </div>
        </div>
      </div>

      <h2 id="what-the-future-holds">Lo que Depara el Futuro</h2>

      <p>El fraude con IA solo se está volviendo más sofisticado. Los investigadores del IRS predicen que para 2027, las videollamadas deepfake serán indistinguibles de las reales. Los estafadores usarán IA para personalizar ataques basados en los perfiles de redes sociales de las víctimas, su historial financiero e incluso datos biométricos.</p>

      <p>Pero hay esperanza. La presión regulatoria está aumentando. Las <a href="https://www.jpost.com/international/article-894049" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">sanciones del Tesoro de EE. UU. contra Kok An</a> muestran que el gobierno está atacando la infraestructura detrás de estas estafas. Y empresas de forense blockchain como LedgerHound están construyendo herramientas que nivelan el campo de juego.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">28 individuos y entidades sancionados</p>
        <p className="text-sm text-slate-600">El Tesoro de EE. UU. sancionó a 28 individuos y entidades en 2026 por operar estafas románticas con cripto, incluido un senador camboyano.</p>
      </div>

      <p>La clave es la velocidad. La IA se mueve rápido, pero los datos blockchain son permanentes. Si actúas en cuestión de horas, no de días, tienes una oportunidad real de recuperar fondos. Por eso creamos el <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">Paquete de Preservación de Emergencia de LedgerHound</Link>, un kit paso a paso que ayuda a las víctimas a congelar activos en exchanges antes de que desaparezcan.</p>

      <h2 id="protect-yourself-in-the-ai-era">Protégete en la Era de la IA</h2>

      <p>La prevención sigue siendo la mejor defensa. Aquí hay consejos prácticos para evitar estafas cripto impulsadas por IA:</p>

      <ol>
        <li>Verifica la identidad a través de un canal separado. Si alguien dice ser de un exchange, llama al número oficial, no confíes en el número que te den.</li>
        <li>Nunca compartas tu frase semilla o claves privadas. Ningún servicio legítimo te las pedirá.</li>
        <li>Desconfía de oportunidades de inversión no solicitadas, especialmente con rendimientos garantizados.</li>
        <li>Usa nuestro <Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">Verificador de Estafas</Link> para verificar cualquier dirección de billetera o plataforma antes de enviar fondos.</li>
      </ol>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Señales de Alerta para Estafas con IA
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Comunicación demasiado perfecta</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Sin errores tipográficos, siempre disponible, recuerda cada detalle: los chatbots de IA son impecables, los humanos no.</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Presión para actuar rápido</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Los estafadores crean urgencia para evitar que pienses críticamente. Las inversiones legítimas no caducan en 24 horas.</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Videollamadas falsas</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Si la persona en pantalla se ve ligeramente extraña o repite frases, podría ser un deepfake. Pídele que gire la cabeza o agite una mano.</span></li>
          </ul>
        </div>
      </div>

      <h2 id="ledgerhound-is-here-to-help">LedgerHound Está Aquí para Ayudar</h2>

      <p>Sabemos lo devastadoras que son estas estafas. Nuestro equipo de analistas forenses certificados ha rastreado miles de millones en cripto robado a través de docenas de blockchains. Ya sea que necesites una verificación rápida o un <Link href={`${base}/report`} className="text-brand-600 hover:underline">informe forense</Link> completo para acciones legales, estamos aquí.</p>

      <p>Comienza con una <Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">evaluación de caso gratuita</Link>, sin compromiso. Revisaremos tu situación y recomendaremos los mejores pasos a seguir. Y si tienes prisa, nuestro <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">Paquete de Preservación de Emergencia</Link> se puede implementar en minutos.</p>

      <p>La IA puede estar impulsando el fraude, pero con las herramientas y la experiencia adecuadas, puedes contraatacar. El blockchain no miente, y nosotros sabemos cómo leerlo.</p>
    </>
  );
}
