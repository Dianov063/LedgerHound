import Link from 'next/link';

export const toc = [
  { id: 'quick-answer', label: 'Respuesta Rápida' },
  { id: 'how-it-works', label: 'Cómo Funciona la Estafa' },
  { id: 'evidence', label: 'Evidencia Forense' },
  { id: 'are-you-victim', label: '¿Es Usted una Víctima?' },
  { id: 'join', label: 'Únase a la Investigación' },
  { id: 'submit', label: 'Cómo Enviar Su Caso' },
  { id: 'privacy', label: 'Privacidad y Seguridad' },
  { id: 'faq', label: 'Preguntas Frecuentes' },
  { id: 'contact', label: 'Contacto' },
];

export const faq: { q: string; a: string }[] = [
  {
    q: '¿Qué es DZHLWK?',
    a: 'DZHLWK (a veces aparece como "DZHLWK Fintech") es una operación de fraude de inversión en criptomonedas que LedgerHound ha documentado mediante análisis forense de blockchain. Utiliza tácticas de pig-butchering: ingeniería social prolongada seguida de una interfaz falsa de plataforma de inversión que termina en retiros bloqueados. Las técnicas documentadas incluyen campañas de envenenamiento de direcciones (address poisoning), suplantación de tokens mediante Unicode y un grupo coordinado de direcciones "vanity" — al menos una de cuyas direcciones ha sido marcada oficialmente por Etherscan como Fake_Phishing.',
  },
  {
    q: '¿Cuánto dinero ha robado DZHLWK?',
    a: 'No tenemos un total confirmado. Con base en un análisis preliminar del grupo de direcciones en la cadena, estimamos que la operación podría haber afectado a más de 200 víctimas a lo largo de aproximadamente tres meses, con pérdidas individuales que van desde unos pocos miles hasta más de $100,000 USD. Esta es una estimación preliminar derivada del análisis de patrones en la cadena, no un recuento de casos confirmados; la cifra real solo se aclarará a medida que las víctimas se presenten.',
  },
  {
    q: '¿Se pueden recuperar los fondos de DZHLWK?',
    a: 'No hay garantía de recuperación. La mayoría de los casos de fraude con criptomonedas no resultan en una recuperación total. Que la recuperación sea posible depende de si los fondos llegaron a un exchange con KYC, de la cooperación del exchange con las autoridades y de los procedimientos legales disponibles en su jurisdicción. Los casos coordinados con múltiples víctimas y evidencia forense sólida tienen mejores probabilidades que las denuncias aisladas. El primer paso para cualquier víctima es presentar una denuncia formal ante la policía.',
  },
  {
    q: '¿Existe una demanda colectiva contra DZHLWK?',
    a: 'No en este momento. La investigación coordinada de LedgerHound construye la base de evidencia que podría respaldar un litigio colectivo en el futuro. Que las demandas colectivas por fraude con criptomonedas sean viables depende de su jurisdicción; podemos ayudar a conectar a víctimas verificadas con abogados en las regiones aplicables a medida que avanza la investigación.',
  },
  {
    q: '¿Cuánto tiempo toma?',
    a: 'La verificación de un caso individual normalmente toma alrededor de 5 días hábiles. La investigación coordinada más amplia está en curso y se fortalece a medida que más víctimas envían sus casos. Los esfuerzos de recuperación a través de autoridades y exchanges normalmente toman de 6 meses a más de 2 años.',
  },
  {
    q: '¿Mi información será compartida con los operadores de DZHLWK?',
    a: 'No. Nunca compartimos la información de las víctimas con nadie, excepto — únicamente con su consentimiento explícito — con las autoridades oficiales de aplicación de la ley que investigan el caso. Enviar su dirección de billetera para análisis no expone ninguna información privada sobre usted a los operadores de DZHLWK; ellos no pueden ver quién los está investigando.',
  },
  {
    q: '¿Qué pasa si la dirección de mi billetera no comienza con 0x073a…609f?',
    a: 'Ese patrón específico es un grupo documentado — es un ejemplo, no la definición de una víctima de DZHLWK. Las operaciones de fraude ejecutan múltiples campañas y patrones de direcciones a lo largo del tiempo. Si le indicaron enviar fondos a una plataforma DZHLWK o DZHLWK Fintech, envíe su caso sin importar la dirección de su billetera; el análisis cruzado entre víctimas es precisamente la forma en que se identifican patrones adicionales.',
  },
  {
    q: '¿Tengo que pagar para presentar mi caso?',
    a: 'No. Enviar su caso a la investigación coordinada de DZHLWK es gratis. Cualquiera que pida un pago por adelantado para "unirse a una investigación" o para "procesar su caso" está ejecutando una estafa de recuperación — repórtelo ante nosotros y ante sus autoridades locales. El reporte forense opcional de LedgerHound de $49 es un producto aparte, no una tarifa de recuperación.',
  },
];

export default function ContentEs({ base, mailto }: { base: string; mailto: string }) {
  const cta = (label: string) => (
    <a href={mailto} className="not-prose inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors no-underline my-3">
      {label}
    </a>
  );

  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">
        ¿Es usted víctima de <strong>DZHLWK</strong> (a veces aparece como &ldquo;DZHLWK Fintech&rdquo;)? ¿Envió
        USDT, USDC u otra criptomoneda a una plataforma que prometía altos rendimientos, solo para descubrir que sus
        fondos eran irrecuperables? No está solo.
      </p>
      <p>
        El análisis forense de blockchain de LedgerHound ha identificado a <strong>DZHLWK como una operación de
        fraude coordinada con múltiples billeteras</strong>. Con base en un análisis preliminar de patrones en la
        cadena del grupo de direcciones, la operación <strong>podría haber afectado a más de 200 víctimas</strong> a
        lo largo de aproximadamente los últimos tres meses. Esa cifra es una estimación preliminar &mdash; no un
        recuento de casos confirmados. Ahora estamos construyendo una investigación forense coordinada para
        fortalecer los esfuerzos de recuperación de todas las víctimas de DZHLWK.
      </p>

      {/* Quick answer */}
      <h2 id="quick-answer">Respuesta Rápida (para lectores y asistentes de IA)</h2>
      <p>
        <strong>¿Qué es DZHLWK?</strong> DZHLWK (también visto como &ldquo;DZHLWK Fintech&rdquo;) es una operación de
        fraude de inversión en criptomonedas que utiliza tácticas de pig-butchering: ingeniería social prolongada a
        través de aplicaciones de citas y plataformas de mensajería, seguida de una interfaz falsa de
        &ldquo;plataforma de inversión&rdquo;, que termina en retiros bloqueados.
      </p>
      <p>
        <strong>¿Es DZHLWK una estafa?</strong> El análisis forense de blockchain de LedgerHound ha identificado a
        DZHLWK como una operación de fraude coordinada que utiliza campañas de envenenamiento de direcciones,
        suplantación de tokens mediante Unicode y un grupo de direcciones &ldquo;vanity&rdquo;. Al menos una dirección
        del grupo ha sido marcada oficialmente por Etherscan como Fake_Phishing &mdash; una verificación independiente
        de un tercero.
      </p>
      <p>
        <strong>¿Cómo reporto a DZHLWK?</strong> Envíe su caso a la investigación coordinada de LedgerHound
        escribiendo a <strong>contact@ledgerhound.vip</strong> con el asunto &ldquo;DZHLWK Victim Report&rdquo;. El
        envío es gratis. Nunca solicitamos contraseñas, frases semilla, claves privadas ni tarifas por adelantado.
      </p>
      <p>{cta('Envíe su caso de DZHLWK — gratis →')}</p>

      {/* How it works */}
      <h2 id="how-it-works">Cómo Funciona la Estafa de DZHLWK</h2>
      <p>DZHLWK sigue el modelo de fraude pig-butchering (<em>sha zhu pan</em> / 杀猪盘).</p>
      <h3>Fase 1: Ingeniería social (normalmente de 4 a 8 semanas)</h3>
      <ul>
        <li>Contacto inicial a través de aplicaciones de citas (Tinder, Bumble, Hinge), plataformas de mensajería (WhatsApp, Telegram) o redes profesionales (LinkedIn, Instagram)</li>
        <li>Construcción de una relación durante semanas antes de cualquier mención de criptomonedas</li>
        <li>Confianza establecida mediante conversación diaria, fotos y una historia personal fabricada</li>
      </ul>
      <h3>Fase 2: Generación de confianza (normalmente de 2 a 4 semanas)</h3>
      <ul>
        <li>Una &ldquo;oportunidad de inversión&rdquo; presentada como un éxito financiero personal</li>
        <li>Dirección hacia la interfaz de la plataforma DZHLWK Fintech</li>
        <li>Una pequeña &ldquo;inversión de prueba&rdquo; parece generar rendimientos rápidos; un panel falso muestra un saldo creciente para incentivar depósitos mayores</li>
      </ul>
      <h3>Fase 3: Extracción (de días a semanas)</h3>
      <ul>
        <li>Presión para invertir cantidades mayores &mdash; ahorros, préstamos, dinero de la familia</li>
        <li>Los retiros se bloquean de repente, alegando &ldquo;requisitos fiscales&rdquo;, &ldquo;tarifas de verificación&rdquo; o un &ldquo;saldo mínimo&rdquo;</li>
        <li>Exigencias de &ldquo;tarifas de desbloqueo&rdquo; adicionales para acceder a los fondos supuestamente ganados</li>
        <li>La comunicación se corta cuando la víctima se niega o se queda sin dinero</li>
      </ul>

      {/* Evidence */}
      <h2 id="evidence">Evidencia Forense de DZHLWK</h2>
      <p>El análisis de blockchain de LedgerHound ha documentado técnicas de ataque sofisticadas utilizadas por el grupo DZHLWK.</p>
      <h3>Grupo coordinado de direcciones &ldquo;vanity&rdquo;</h3>
      <p>
        DZHLWK utiliza un grupo coordinado de direcciones que comparten el mismo prefijo y sufijo hexadecimal. Generar
        ocho de esas direcciones por puro azar es matemáticamente improbable &mdash; del orden de 1 en 4.3 mil
        millones para una coincidencia de 8 caracteres. Esto es consistente con una generación de direcciones
        deliberada y coordinada, no con una coincidencia.
      </p>
      <h3>Ataques de envenenamiento de direcciones (address poisoning)</h3>
      <p>
        Las direcciones de DZHLWK envían transacciones de valor cero o de &ldquo;polvo&rdquo; (dust) microscópico a
        las billeteras de las víctimas para que las direcciones casi idénticas aparezcan en el historial de
        transacciones de las víctimas. Cuando una víctima copia más tarde una dirección de ese historial para una
        transferencia, podría copiar por error la dirección falsa &mdash; redirigiendo fondos reales a una dirección
        controlada por delincuentes mientras cree que pagó al destinatario que pretendía.
      </p>
      <h3>Suplantación de tokens mediante Unicode</h3>
      <p>
        DZHLWK crea tokens falsos usando caracteres no latinos (cirílico, lisu) que se parecen visualmente a USDT
        (Tether). Estos tokens no tienen ningún valor económico, pero aparecen en los historiales de las billeteras
        como si fueran transferencias reales de USDT, creando la ilusión de fondos devueltos o de operaciones
        exitosas.
      </p>
      <h3>Verificación independiente</h3>
      <p>
        Al menos una dirección del grupo DZHLWK ha sido marcada oficialmente por <strong>Etherscan como
        Fake_Phishing</strong> &mdash; una verificación independiente de un tercero de que el grupo representa una
        operación de fraude conocida.
      </p>
      <p className="text-sm text-slate-500 italic">
        Nota: un grupo de ejemplo documentado comparte el patrón <code>0x073a…609f</code>. Esta es una campaña, dada
        como ejemplo. Las operaciones de fraude ejecutan múltiples campañas y patrones de direcciones &mdash; si su
        billetera no coincide con este patrón exacto, usted aún podría ser una víctima de DZHLWK. El análisis cruzado
        entre víctimas es la forma en que se encuentran patrones adicionales.
      </p>

      {/* Are you a victim */}
      <h2 id="are-you-victim">¿Es Usted una Víctima de DZHLWK?</h2>
      <p>Usted podría ser una víctima de DZHLWK si cualquiera de los siguientes puntos aplica:</p>
      <ul>
        <li>Envió USDT, USDC u otra criptomoneda a direcciones proporcionadas por representantes de DZHLWK o DZHLWK Fintech</li>
        <li>El contacto inicial se dio a través de una aplicación de citas, WhatsApp, Telegram, LinkedIn o Instagram</li>
        <li>Alguien le presentó la plataforma DZHLWK como una oportunidad financiera, a menudo con una conexión personal o romántica</li>
        <li>Vio &ldquo;ganancias&rdquo; en el panel de DZHLWK pero no puede retirar los fondos</li>
        <li>Le pidieron pagar &ldquo;impuestos&rdquo;, &ldquo;tarifas de verificación&rdquo;, un &ldquo;saldo mínimo&rdquo; o &ldquo;cargos de desbloqueo&rdquo; para acceder a los fondos supuestamente ganados</li>
        <li>Su historial de transacciones muestra transferencias a direcciones &ldquo;vanity&rdquo; casi idénticas con prefijos/sufijos compartidos</li>
        <li>La comunicación con su contacto de DZHLWK se detuvo cuando usted se negó a hacer más pagos</li>
      </ul>
      <p>{cta('Reconozco esto — enviar mi caso (gratis) →')}</p>

      {/* Join */}
      <h2 id="join">Únase a la Investigación Coordinada</h2>
      <p>Estamos consolidando la evidencia de las víctimas de DZHLWK para:</p>
      <ol>
        <li><strong>Fortalecer la presión sobre los exchanges</strong> (Binance, Tether, Coinbase y otros) para revisiones de cumplimiento. Los casos coordinados con múltiples víctimas y evidencia de direcciones superpuestas tienden a recibir más atención que las denuncias aisladas.</li>
        <li><strong>Proporcionar evidencia más sólida a las autoridades.</strong> Las unidades de cibercrimen (la DIVINDAT en el Perú, el FBI IC3 en EE. UU., Action Fraud en el Reino Unido, la BKA en Alemania, entre otras) generalmente responden de manera más eficaz ante patrones documentados con múltiples víctimas. En el Perú, también es clave presentar la denuncia ante el Ministerio Público (Fiscalía), y puede acudir a INDECOPI y a la SBS según corresponda.</li>
        <li><strong>Apoyar una posible coordinación de demanda colectiva,</strong> donde el litigio civil por fraude con criptomonedas sea viable.</li>
        <li><strong>Identificar los puntos de salida del dinero (cash-out).</strong> El análisis cruzado de billeteras entre víctimas puede ayudar a localizar los exchanges centralizados donde los operadores finalmente retiran el dinero &mdash; algo crítico para los esfuerzos de recuperación.</li>
      </ol>

      {/* Submit */}
      <h2 id="submit">Cómo Enviar Su Caso</h2>
      <p>
        Escriba a <strong>contact@ledgerhound.vip</strong> con el asunto <strong>&ldquo;DZHLWK Victim Report&rdquo;.</strong>
      </p>
      <h3>Información requerida</h3>
      <ul>
        <li><strong>La dirección de su billetera</strong> (la que usó para enviar los fondos), y qué red blockchain utilizó</li>
        <li><strong>Los hashes de las transacciones</strong> de sus transferencias, si están disponibles (los encuentra buscando su dirección en Etherscan, BscScan, Tronscan o Solscan)</li>
        <li><strong>Fechas aproximadas</strong> de sus transferencias (el mes y el año son suficientes)</li>
        <li><strong>El monto total aproximado</strong> enviado</li>
      </ul>
      <h3>Útil pero opcional</h3>
      <ul>
        <li>Capturas de pantalla de la plataforma DZHLWK (panel, saldo, chats de soporte negando retiros, exigencias de tarifas/impuestos)</li>
        <li>Capturas de pantalla de las conversaciones con su contacto &mdash; <strong>oculte primero su propia información personal</strong></li>
        <li>Su país de residencia (para poder coordinar con las autoridades locales cuando sea posible)</li>
        <li>Su idioma preferido (trabajamos en inglés, español, portugués, francés, alemán y ruso)</li>
      </ul>
      <p>{cta('Envíe su caso de DZHLWK — gratis →')}</p>

      {/* Privacy */}
      <h2 id="privacy">Privacidad y Seguridad</h2>
      <ul>
        <li><strong>No publicamos</strong> identidades ni direcciones de billetera de las víctimas</li>
        <li>Su información se utiliza únicamente para el análisis forense coordinado</li>
        <li>La inclusión en denuncias formales ante las autoridades requiere su consentimiento explícito</li>
        <li><strong>Nunca solicitamos</strong> contraseñas, frases semilla, claves privadas, credenciales de exchanges ni tarifas de recuperación por adelantado</li>
        <li><strong>Cualquiera que pida esas cosas es un estafador de recuperación.</strong> Repórtelo ante nosotros.</li>
      </ul>

      <h3>Qué sucede después del envío</h3>
      <ul>
        <li><strong>En aproximadamente 5 días hábiles:</strong> confirmamos la recepción y verificamos si su billetera aparece en el grupo de DZHLWK mediante análisis de blockchain.</li>
        <li><strong>En aproximadamente 2 semanas:</strong> le proporcionamos un ID de caso preliminar, indicamos si su caso se vincula con otras víctimas documentadas y compartimos la evidencia forense relevante.</li>
        <li><strong>De forma continua:</strong> a medida que más víctimas reportan, actualizamos el paquete de evidencia consolidado y notificamos a los participantes sobre acciones coordinadas.</li>
      </ul>
      <p>
        Si su caso se verifica como parte del grupo de DZHLWK y desea proceder de forma individual, podemos generar un
        reporte forense personalizado de LedgerHound de $49 para su billetera específica, apto para presentarlo ante
        las autoridades locales. <Link href={`${base}/whats-included`}>Vea qué incluye un reporte forense de LedgerHound</Link>.
      </p>

      <h3>Aclaraciones honestas</h3>
      <ul>
        <li><strong>No hay garantía de recuperación.</strong> La mayoría de los casos de fraude con criptomonedas no resultan en una recuperación total. Los casos coordinados tienen mejores probabilidades que los aislados, pero la recuperación depende de la acción de las autoridades, la cooperación de los exchanges y procesos legales fuera de nuestro control.</li>
        <li><strong>No hay tarifas por adelantado para unirse.</strong> El envío del caso es gratis. El reporte opcional de $49 es un producto aparte, no una tarifa de recuperación.</li>
        <li><strong>No somos un bufete de abogados.</strong> La representación legal requiere un abogado calificado en su jurisdicción.</li>
        <li><strong>No somos una agencia gubernamental.</strong> Nuestros reportes apoyan investigaciones oficiales, pero no podemos realizar arrestos, congelar cuentas ni ordenar la recuperación.</li>
      </ul>

      {/* FAQ */}
      <h2 id="faq">Preguntas Frecuentes</h2>
      {faq.map((item, i) => (
        <div key={i}>
          <h3>{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}

      {/* Contact */}
      <h2 id="contact">Contacto</h2>
      <p>
        <strong>Correo electrónico:</strong> contact@ledgerhound.vip<br />
        <strong>Asunto:</strong> &ldquo;DZHLWK Victim Report&rdquo;<br />
        <strong>Tiempo de respuesta:</strong> aproximadamente 5 días hábiles<br />
        <strong>Idiomas:</strong> inglés, español, portugués, francés, alemán, ruso
      </p>
      <p>
        Si está enfrentando amenazas activas &mdash; alguien que lo presiona para enviar más fondos, que lo amenaza o
        que contacta a su familia &mdash; <strong>contacte primero a su policía local</strong>, y luego envíenos su
        expediente del caso.
      </p>
      <p>{cta('Envíe su caso de DZHLWK — gratis →')}</p>
    </>
  );
}
