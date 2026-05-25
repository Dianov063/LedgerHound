import Link from 'next/link';

/** Anclas del índice (secciones H2). */
export const toc = [
  { id: 'quick-answer', label: 'Respuesta Rápida' },
  { id: 'who-uses', label: 'Quién Usa Estos Informes' },
  { id: 'sections', label: 'Qué Contiene el Informe' },
  { id: 'templates', label: 'Plantillas de Email Incluidas' },
  { id: 'faq', label: 'Preguntas Frecuentes' },
  { id: 'get-started', label: 'Cómo Empezar' },
];

/** Fuente única de la sección de preguntas — se renderiza abajo Y se emite como FAQPage JSON-LD. */
export const faq: { q: string; a: string }[] = [
  {
    q: '¿El informe de LedgerHound es admisible en un tribunal?',
    a: 'El informe automatizado de $49 está diseñado para denuncias policiales, revisiones de cumplimiento de exchanges, soporte a litigios civiles y reclamos de seguros. Para testimonio pericial formal, LedgerHound ofrece un servicio aparte de investigación forense certificada.',
  },
  {
    q: '¿Qué tan rápido recibo el informe?',
    a: 'Los informes se generan automáticamente tras el pago, típicamente en 5 a 10 minutos. El PDF y las tres plantillas de email se entregan a su correo junto con el hash de verificación SHA-256.',
  },
  {
    q: '¿Qué idiomas y blockchains se admiten?',
    a: 'Los informes están disponibles en inglés y español. Las blockchains admitidas son Ethereum, Bitcoin, Solana, TRON, BNB Chain, Base, Arbitrum y Optimism. La guía legal por país es actualmente más completa para Perú; México, Colombia, Argentina y Chile están planificados.',
  },
  {
    q: '¿Cuántas páginas tiene el informe?',
    a: 'Típicamente de 18 a 22 páginas, según la complejidad del caso. Algunas secciones — como el Análisis de Técnicas de Ataque, el Análisis Cross-Chain y los Recursos por País — aparecen solo cuando son relevantes para su caso, por lo que la extensión exacta varía.',
  },
  {
    q: '¿LedgerHound garantiza la recuperación de fondos?',
    a: 'No. El informe declara explícitamente que la mayoría de los casos de fraude con criptomonedas no terminan en recuperación total. Su propósito es entregar a las autoridades y a la asesoría legal el paquete de evidencia más sólido posible. La recuperación depende de la acción de las autoridades, la cooperación del exchange y procesos legales fuera del control de LedgerHound.',
  },
  {
    q: '¿En qué se diferencia LedgerHound de los servicios de "recuperación"?',
    a: 'Brindamos análisis forense blockchain con cadena de custodia autocontenida. Nunca prometemos recuperación garantizada, nunca cobramos adelantos más allá del informe de $49 y nunca pedimos contraseñas, frases semilla ni claves privadas. Cualquier servicio que prometa retornos garantizados o pida esos datos probablemente es una estafa.',
  },
];

export default function ContentEs({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">
        Un informe forense de LedgerHound es un análisis blockchain de una billetera de criptomonedas
        involucrada en un fraude, entregado como documento PDF por <strong>$49 USD</strong>. Está hecho para
        usarse con autoridades policiales, equipos de cumplimiento de exchanges y asesoría legal. Esta página
        describe cada sección del informe y para qué sirve.
      </p>
      <p>
        El informe tiene <strong>típicamente de 18 a 22 páginas</strong>, según la complejidad del caso. Varias
        secciones aparecen solo cuando son relevantes para su caso específico, por lo que la extensión exacta
        varía de una billetera a otra.
      </p>

      {/* Respuesta rápida */}
      <h2 id="quick-answer">Respuesta Rápida</h2>
      <p>Un informe forense de $49 de LedgerHound contiene:</p>
      <ul>
        <li>Análisis forense blockchain en PDF, <strong>típicamente de 18 a 22 páginas</strong></li>
        <li>Evaluaciones de <strong>puntuación de riesgo y probabilidad de recuperación</strong>, cada una con un descargo honesto</li>
        <li><strong>Documentación de técnicas de ataque</strong> &mdash; envenenamiento de direcciones, suplantación Unicode, detección de grupos vanity (se incluye cuando se detectan tales ataques)</li>
        <li><strong>Identificación de entidades</strong> &mdash; exchanges, mezcladores, protocolos DeFi y direcciones de estafa conocidas</li>
        <li><strong>Historial de transacciones y un diagrama de flujo de fondos</strong></li>
        <li><strong>Guía legal por país</strong> (actualmente soporte completo para Perú)</li>
        <li><strong>Tres plantillas de email listas para usar</strong> para DIVINDAT, cumplimiento de Binance y el equipo legal de Tether</li>
        <li>Un <strong>hash de cadena de custodia SHA-256</strong> embebido en el PDF</li>
      </ul>
      <p>
        Los informes están disponibles en <strong>inglés y español</strong>. Blockchains admitidas: Ethereum,
        Bitcoin, Solana, TRON, BNB Chain, Base, Arbitrum y Optimism.
      </p>

      {/* Quién usa */}
      <h2 id="who-uses">Quién Usa Estos Informes</h2>
      <ul>
        <li><strong>Víctimas de fraude con criptomonedas</strong> que presentan denuncias policiales y escalamientos ante exchanges</li>
        <li><strong>Estudios de abogados</strong> que construyen evidencia blockchain para casos de recuperación civil</li>
        <li><strong>Equipos de cumplimiento de exchanges</strong> que responden a solicitudes de preservación</li>
        <li><strong>Autoridades policiales</strong> que reciben documentación forense de las víctimas</li>
        <li><strong>Peritos de seguros</strong> que evalúan reclamos por fraude con criptomonedas</li>
      </ul>

      {/* Secciones */}
      <h2 id="sections">Qué Contiene el Informe</h2>
      <p className="text-sm text-slate-500 italic">
        El informe fluye en el orden que se describe abajo. Para que las referencias sigan siendo exactas aunque
        la extensión cambie según el caso, describimos dónde aparece cada sección en lugar de un número de página fijo.
      </p>

      <h3>Resumen Ejecutivo</h3>
      <p>
        Una vista general del caso al inicio del informe, para fiscales, abogados y oficiales de cumplimiento.
        Contiene la puntuación de riesgo (0&ndash;100) con un desglose de factores verificable, una estimación de
        probabilidad de recuperación con un descargo honesto, la pérdida económica confirmada claramente separada de
        los tokens falsificados sin valor, y de 3 a 5 hallazgos clave. Para los países admitidos, dentro de este resumen
        aparece una <strong>lista de documentos</strong> (a qué autoridad acudir primero y en qué orden). Las filas del
        desglose de riesgo suman matemáticamente el total mostrado &mdash; un invariante por construcción &mdash; de modo
        que cualquier lector puede verificar la puntuación.
      </p>

      <h3>Evaluación de Preparación para la Recuperación</h3>
      <p>
        Una calificación de qué tan completo es su paquete de evidencia &mdash; deliberadamente separada de la
        probabilidad de recuperación. La <em>preparación</em> mide qué tan sólida es su documentación; la
        <em> probabilidad</em> mide qué tan probable es recuperar el dinero. Un caso puede tener evidencia excelente
        (alta preparación) pero baja probabilidad de recuperación si no se identifica un punto de salida KYC del
        estafador. Incluye un inventario de evidencia y una calificación de dificultad de investigación.
      </p>

      <h3>Resumen de la Investigación</h3>
      <p>
        Una clasificación conductual de la billetera analizada (víctima, estafador, agregador, tránsito) con un
        porcentaje de confianza y los datos específicos que la sustentan, además de una visualización del flujo de fondos
        (origen &rarr; billetera analizada &rarr; destino) y una puntuación de solidez de la evidencia. Esta sección
        clasifica explícitamente las billeteras de víctimas como víctimas, con su razonamiento de apoyo &mdash; protege a
        las víctimas de ser caracterizadas erróneamente como responsables.
      </p>

      <h3>Resumen de Activos y Cronología de Actividad</h3>
      <p>
        Una sección combinada que contabiliza los activos token por token y presenta la cronología de eventos clave.
        Las criptomonedas reales y los tokens falsificados sin valor <strong>nunca se suman juntos</strong>: la pérdida
        económica reportada usa solo activos con valor real, de modo que los reclamos nunca se inflan con tokens de valor
        cero. La cronología etiqueta los roles de los receptores (p. ej. RECOLECTOR PRINCIPAL, DIRECCIÓN DE SUPLANTACIÓN)
        y, cuando hay envenenamiento de direcciones, resalta la colisión de direcciones visualmente similares
        (mismo prefijo/sufijo). Es una cronología abreviada de eventos seleccionados, con una nota que remite al historial
        completo de transacciones.
      </p>

      <h3>Análisis de Patrones de Comportamiento</h3>
      <p>
        Detección de patrones de fraude &mdash; reenvío rápido (la firma del embudo de estafa, reportado con métricas
        por volumen y por número de depósitos), preferencia por montos redondos, agrupación por hora del día y análisis de
        diversidad de contrapartes. Cada patrón incluye una nota metodológica y una calificación de confianza.
      </p>

      <h3>Analítica de la Billetera</h3>
      <p>
        Una vista estadística: conteos de transacciones, contrapartes únicas y métricas de diversidad de activos, además
        de las principales contrapartes con <strong>indicadores de dirección IN/OUT</strong> y volúmenes agregados por
        destino (totales acumulados, no máximos de una sola transacción).
      </p>

      <h3>Identificación de Entidades y Puntos de Salida</h3>
      <p>
        Una sección combinada que etiqueta entidades conocidas para dirigir citaciones &mdash; billeteras de exchanges
        (con disponibilidad de citación KYC), contratos de mezcladores, protocolos DeFi y contratos puente &mdash; junto
        con los destinos que recibieron salidas reales, agregados por destino.
      </p>

      <h3>Verificación de Direcciones e Inteligencia Externa <span className="text-slate-400 font-normal">(se incluye cuando hay coincidencias)</span></h3>
      <p>
        Verificación entre fuentes de las direcciones sospechosas contra la Base de Datos de Estafas de LedgerHound, la
        lista OFAC SDN, los reportes comunitarios de Chainabuse, los indicadores de riesgo de GoPlus Security y las
        etiquetas oficiales Fake_Phishing de Etherscan (verificación independiente de terceros). Cada dirección muestra
        cuántas fuentes la confirman &mdash; la concordancia entre fuentes aumenta el peso probatorio.
      </p>

      <h3>Análisis de Técnicas de Ataque <span className="text-slate-400 font-normal">(se incluye cuando se detectan ataques sofisticados)</span></h3>
      <p>
        Documentación detallada de ataques sofisticados: <strong>campañas de envenenamiento de direcciones</strong> con
        detección de grupos vanity y un cálculo de improbabilidad matemática; <strong>suplantación de tokens Unicode</strong>
        (tokens falsos construidos con escrituras no latinas como cirílico o lisu) documentada en notación de codepoints
        U+XXXX con la metodología de normalización para verificación independiente; y una explicación del
        <strong> mecanismo de transacciones dust</strong> &mdash; cómo las transferencias de valor cero sembradas en el
        historial de la víctima permiten la confusión de direcciones posterior. Esta sección hace comprensibles los
        ataques sofisticados para investigadores y jueces no técnicos.
      </p>

      <h3>Análisis Cross-Chain <span className="text-slate-400 font-normal">(se incluye cuando se detecta actividad cross-chain)</span></h3>
      <p>
        Cuando los fondos se mueven entre cadenas a través de contratos puente, esta sección identifica los puentes
        involucrados y recomienda el rastreo en las cadenas conectadas.
      </p>

      <h3>Gráfico de Flujo de Fondos</h3>
      <p>
        Un diagrama visual del movimiento de criptomonedas. Los flujos de fondos reales se dibujan como líneas sólidas
        (rojo saliente, verde entrante); los flujos de tokens falsificados son líneas grises punteadas con etiquetas de
        &ldquo;sin valor&rdquo;. Una leyenda distingue los flujos reales de los falsificados, y las conexiones con
        exchanges, mezcladores y entidades conocidas están claramente etiquetadas.
      </p>

      <h3>Historial de Transacciones</h3>
      <p>
        Una lista representativa de transacciones ordenada cronológicamente &mdash; hasta tres transacciones por activo
        para evitar inflar el documento, ordenadas de la más antigua a la más reciente para el hilo de la investigación,
        con las filas de tokens falsificados resaltadas y una referencia al número total de transacciones.
      </p>

      <h3>Evaluación de Recuperación y Recomendaciones Legales</h3>
      <p>
        Una sección combinada con un análisis de recuperación de tres escenarios &mdash; (A) los fondos llegaron a una
        salida de exchange KYC identificable, (B) fondos en billeteras no identificadas, (C) fondos mezclados o movidos
        cross-chain &mdash; cada uno con su probabilidad y dificultad, seguido de pasos accionables: preservación del punto
        de entrada KYC, rastreo de salida de contrapartes, una denuncia ante el FBI IC3 o la policía local citando el ID
        del caso, notificación de cumplimiento al exchange con lenguaje de solicitud de preservación, coordinación con el
        emisor del token y la investigación certificada opcional para testimonio en tribunal.
      </p>

      <h3>Recursos por País <span className="text-slate-400 font-normal">(se incluye cuando hay guía localizada disponible)</span></h3>
      <p>
        Contactos y procedimientos de autoridades localizados. Actualmente disponible para <strong>Perú</strong>: contacto
        y procedimiento de denuncia ante DIVINDAT (la división de delitos de alta tecnología), el portal de denuncias en
        línea del Ministerio Público, escalamiento ante la SBS, procedimientos de protección al consumidor de INDECOPI,
        verificación de abogados del Colegio de Abogados de Lima (CAL) y el sistema de alerta de identidad de RENIEC.
        México, Colombia, Argentina y Chile están planificados.
      </p>

      <h3>Pasos Concretos de Recuperación</h3>
      <p>
        Una lista de verificación paso a paso: (1) preserve los registros KYC en su exchange de financiamiento, (2)
        presente denuncias ante las autoridades (IC3, policía local, FTC), (3) procedimientos legales (estrategia de
        citación, recuperación de activos) y (4) buenas prácticas de preservación de evidencia.
      </p>

      <h3>Descargo Legal y Metodología</h3>
      <p>
        Descargos profesionales y referencias metodológicas &mdash; el informe es explícito sobre su propio alcance y
        sus limitaciones.
      </p>

      <h3>Cadena de Custodia &mdash; Verificación SHA-256</h3>
      <p>
        Verificación criptográfica de la integridad de la evidencia en la última página. Se calcula un hash SHA-256 sobre
        el contenido del informe (excluyendo el propio campo de verificación) y se embebe en el PDF; cualquier alteración
        cambia el hash. El mismo hash aparece en el email de entrega y en las tres plantillas de email, y puede verificarse
        con herramientas estándar (<code>sha256sum</code>). Esto respalda las cadenas de evidencia formales en tribunal, el
        testimonio pericial y el cumplimiento regulatorio.
      </p>

      {/* Plantillas */}
      <h2 id="templates">Plantillas de Email Incluidas (3 Adjuntos)</h2>
      <p>
        Además del PDF, el paquete de $49 incluye tres plantillas de email listas para usar en formato Markdown.
      </p>
      <h3>Denuncia DIVINDAT (casos de Perú)</h3>
      <p>
        Una denuncia formal pre-redactada para la división de delitos de alta tecnología del Perú. Incluye referencias
        legales verificadas (artículos 196&deg; y 196-A&deg; del Código Penal peruano y la Ley 30096), datos de contacto
        actuales de DIVINDAT, una explicación del cómputo de la pérdida que justifica el total como pérdida patrimonial,
        salvaguardas anti-confusión que separan los fondos reales de los tokens falsificados, y la referencia a la cadena
        de custodia SHA-256.
      </p>
      <h3>Solicitud de Cumplimiento a Binance</h3>
      <p>
        Una plantilla para la categoría de soporte &ldquo;Report fraud/scam&rdquo; de Binance (el canal correcto y
        verificado &mdash; no un correo de cumplimiento general). Incluye la aclaración del campo UID (Binance requiere el
        UID de la cuenta, no solo el email), documentación del grupo vanity que además señala las direcciones que solo
        sembraron dust, lenguaje de solicitud de preservación seguro para cumplimiento, y protección anti-cebo que separa
        las pérdidas reales de los tokens sin valor.
      </p>
      <h3>Notificación al Equipo Legal de Tether</h3>
      <p>
        Una plantilla para el equipo legal de Tether Operations Limited. Incluye un descargo honesto de que Tether procesa
        congelamientos principalmente a solicitud de las autoridades, la recomendación de enviarla tras obtener un número de
        expediente policial, las direcciones de contrato completas de los tokens USDT falsificados, y un formato de
        presentación del paquete de evidencia.
      </p>

      {/* FAQ */}
      <h2 id="faq">Preguntas Frecuentes</h2>
      {faq.map((item, i) => (
        <div key={i}>
          <h3>{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}

      {/* Empezar */}
      <h2 id="get-started">Cómo Empezar</h2>
      <p>
        <Link href={`${base}/report`} className="text-brand-600 font-semibold hover:underline">
          Genere su informe forense &mdash; $49 &rarr;
        </Link>
      </p>
      <p><strong>Lo que necesitará:</strong></p>
      <ul>
        <li>La dirección de la billetera que envió los fondos al fraude</li>
        <li>Un correo electrónico para la entrega del informe</li>
        <li>Un método de pago (tarjeta de crédito vía Stripe)</li>
      </ul>
      <p className="text-sm text-slate-500">
        Blockchains admitidas: Ethereum, Bitcoin, Solana, TRON, BNB Chain, Base, Arbitrum, Optimism.
      </p>
    </>
  );
}
