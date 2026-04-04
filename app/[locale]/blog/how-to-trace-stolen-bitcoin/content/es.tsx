import Link from 'next/link';
import { CheckCircle2, Shield, ArrowRight } from 'lucide-react';

export default function ContentEs({ base }: { base: string }) {
  return (
    <>
      {/* Introduccion */}
      <p className="text-lg text-slate-700 leading-relaxed">
        Enviaste criptomonedas a lo que creias que era una plataforma de inversion, un exchange o un contacto legitimo, y ahora han desaparecido. Tu primera pregunta probablemente sea: <em>¿Se pueden rastrear las criptomonedas?</em>
      </p>
      <p>
        La respuesta, en la mayoria de los casos, es si.
      </p>
      <p>
        A pesar de la percepcion comun de que las criptomonedas son anonimas e imposibles de rastrear, lo cierto es lo contrario para la mayoria de las blockchains principales. Cada transaccion de Bitcoin, cada transferencia de Ethereum, cada movimiento de USDT — todo queda registrado de forma permanente en un libro contable publico que cualquier persona en el mundo puede leer. Incluyendo a los investigadores.
      </p>
      <p>
        Esta guia explica exactamente como funciona el rastreo de criptomonedas, que hacen los investigadores paso a paso, y que puedes hacer ahora mismo para maximizar tus posibilidades de recuperacion.
      </p>

      {/* Seccion 1 */}
      <h2 id="blockchain-transparency">La Verdad Fundamental Sobre la Transparencia de la Blockchain</h2>
      <p>
        Bitcoin y la mayoria de las principales criptomonedas son <strong>pseudonimas, no anonimas</strong>. Esta es una distincion critica.
      </p>
      <p>
        Tu direccion de billetera no contiene tu nombre. Pero cada transaccion que realizas — a quien, cuanto, cuando — queda escrita de forma permanente en una blockchain publica que no puede ser alterada ni eliminada.
      </p>

      {/* Cita destacada */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">Pseudonimo, No Anonimo</p>
        <p className="text-sm text-slate-600">
          A pesar de las percepciones iniciales de anonimato, la mayoria de las transacciones con criptomonedas pueden rastrearse mediante herramientas de analisis blockchain. Cada transferencia de valor queda registrada de forma permanente en libros contables publicos como Bitcoin o Ethereum.
        </p>
      </div>

      <p>
        Esta transparencia radical ha transformado las investigaciones financieras. El desafio no es si las transacciones pueden verse — sino interpretar que significan esas transacciones y conectar las direcciones pseudonimas con identidades del mundo real.
      </p>

      {/* Seccion 2 */}
      <h2 id="whats-visible">Que Informacion Es Visible en la Blockchain</h2>
      <p>
        Cuando envias criptomonedas, la siguiente informacion queda registrada de forma permanente:
      </p>

      {/* Cuadro informativo */}
      <div className="not-prose my-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-blue-700 font-display font-bold text-lg">
          <Shield size={20} />
          Lo Que Registra la Blockchain
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Siempre visible:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Direccion de billetera del remitente</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Direccion de billetera del destinatario</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Monto transferido</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Fecha y hora (marca de tiempo exacta del bloque)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Hash de transaccion (identificador unico)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Comisiones de red pagadas</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">A veces recuperable:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> Direccion IP del remitente (capturada por los nodos de la red al momento de la transmision)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> Datos de ubicacion geografica (a partir de la IP)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> Conexion con otras direcciones controladas por la misma persona</li>
          </ul>
        </div>
      </div>

      <p>
        Esto significa que a partir de una sola direccion de billetera o hash de transaccion, un investigador puede reconstruir el historial completo de donde provinieron los fondos y hacia donde fueron.
      </p>

      {/* Seccion 3 */}
      <h2 id="how-tracing-works">Paso a Paso: Como Funciona Realmente el Rastreo de Criptomonedas</h2>

      <h3>Paso 1: Recepcion — Recopilacion de la Evidencia Inicial</h3>
      <p>
        Toda investigacion comienza con lo que la victima puede proporcionar:
      </p>
      <ul>
        <li><strong>Hash de transaccion</strong> — el identificador unico de tu pago (tiene el formato <code>0x7f3a...</code>)</li>
        <li><strong>Direccion de billetera</strong> — la direccion a la que enviaste los fondos</li>
        <li><strong>Nombre de la plataforma</strong> — el sitio web o aplicacion fraudulenta</li>
        <li><strong>Fechas y montos</strong> — cuando se realizo cada transferencia</li>
        <li><strong>Capturas de pantalla</strong> — de la plataforma, comunicaciones, tu cuenta</li>
      </ul>
      <p>
        Incluso si solo tienes uno de estos elementos, generalmente se puede iniciar un rastreo. En la mayoria de los casos, una sola direccion de billetera o hash de transaccion es suficiente para comenzar.
      </p>

      <h3>Paso 2: Mapeo de Transacciones</h3>
      <p>
        El investigador carga la direccion inicial en una plataforma de inteligencia blockchain (Chainalysis Reactor, TRM Labs, Elliptic o similar) y comienza a mapear cada transaccion conectada a esa direccion.
      </p>

      {/* Cita destacada */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">Mapeo Visual del Flujo de Fondos</p>
        <p className="text-sm text-slate-600">
          Los datos transaccionales se convierten en mapas visuales y diagramas de flujo, mostrando las interacciones del sujeto con exchanges conocidos y otras entidades, rastreando las transferencias financieras hasta sus puntos finales. El mapeo visual facilita enormemente el reconocimiento de patrones, como el escalonamiento y las cadenas de pelado (peel chains), comunmente utilizados para el lavado de dinero.
        </p>
      </div>

      <p>
        Esto crea un grafico visual — exactamente como nuestra herramienta gratuita Graph Tracer — que muestra el flujo de fondos a traves de multiples billeteras.
      </p>

      <h3>Paso 3: Analisis de Agrupamiento (Cluster Analysis)</h3>
      <p>
        Una sola direccion rara vez muestra el panorama completo. Los delincuentes utilizan multiples billeteras para ocultar el rastro. El analisis de agrupamiento agrupa direcciones que probablemente estan controladas por la misma persona.
      </p>
      <p>
        Un cluster es un grupo de direcciones de criptomonedas controladas por la misma persona o entidad. Ampliar el enfoque de una investigacion de una sola direccion a un cluster mas grande puede incrementar drasticamente la cantidad de evidencia disponible para la desanonimizacion y el rastreo de activos.
      </p>
      <p>
        Las tecnicas de agrupamiento mas comunes incluyen:
      </p>
      <ul>
        <li><strong>Analisis de gasto comun</strong> — multiples direcciones utilizadas en la misma transaccion</li>
        <li><strong>Reutilizacion de direcciones</strong> — la misma direccion utilizada repetidamente</li>
        <li><strong>Analisis temporal</strong> — transacciones que ocurren siguiendo patrones</li>
      </ul>

      <h3>Paso 4: Identificacion del Exchange — El Avance Critico</h3>
      <p>
        Aqui es donde las investigaciones se vuelven accionables. Cuando los fondos robados llegan a un <strong>exchange que cumple con KYC</strong> (Coinbase, Binance, Kraken, OKX, etc.), el exchange tiene legalmente en archivo la verificacion de identidad del titular de la cuenta.
      </p>

      {/* Cita destacada */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">La Via del Requerimiento Judicial</p>
        <p className="text-sm text-slate-600">
          Las herramientas de inteligencia blockchain identifican transacciones con exchanges como Coinbase y Binance. Los requerimientos judiciales a entidades que cumplen con KYC/AML solicitan la entrega de documentos de identidad del propietario del Bitcoin — convirtiendo direcciones pseudonimas en identidades del mundo real.
        </p>
      </div>

      <p>
        Una vez que los investigadores identifican que exchange recibio los fondos, un abogado puede presentar un requerimiento judicial — obligando al exchange a revelar el nombre del titular de la cuenta, su direccion, documentos de identidad e informacion bancaria.
      </p>

      <h3>Paso 5: Analisis de Atribucion</h3>
      <p>
        Las plataformas profesionales de inteligencia blockchain mantienen bases de datos con millones de direcciones de billetera etiquetadas — exchanges, mezcladores, protocolos DeFi, entidades criminales conocidas y direcciones marcadas.
      </p>
      <p>
        Los profesionales forenses de blockchain utilizan una combinacion de herramientas de codigo abierto, comerciales y propietarias. La base de todo trabajo forense es el explorador de blockchain. Los exploradores forenses avanzados incluyen metadatos adicionales: etiquetas de billetera (por ejemplo, "Billetera caliente de Binance," "Mezclador marcado"), puntuaciones de riesgo basadas en asociaciones de fraude conocidas.
      </p>
      <p>
        Cuando los fondos robados tocan una de estas direcciones etiquetadas, los investigadores pueden identificar inmediatamente la entidad involucrada.
      </p>

      <h3>Paso 6: Inteligencia de Direcciones IP</h3>
      <p>
        Este es un metodo de rastreo menos conocido pero poderoso. Cuando una transaccion se transmite a la red blockchain, la direccion IP de la computadora emisora puede ser capturada por nodos de vigilancia operados por empresas de inteligencia blockchain.
      </p>
      <p>
        Los metadatos que vulneran la privacidad se recopilan a traves de sistemas de vigilancia blockchain, que operan redes de nodos que "escuchan" y "rastrean" direcciones de Protocolo de Internet (IP) asociadas con ciertas transacciones. Las direcciones IP, cuando estan disponibles, pueden proporcionar informacion sobre la ubicacion geografica del sujeto en el momento de la transaccion.
      </p>
      <p>
        Esto puede ubicar al estafador en una ciudad o pais especifico — inteligencia critica para la coordinacion con las fuerzas del orden internacionales.
      </p>

      <h3>Paso 7: Informe Forense</h3>
      <p>
        Todo se compila en un informe forense listo para tribunales que contiene:
      </p>
      <ul>
        <li>Mapa completo de transacciones desde la victima hasta el destino final</li>
        <li>Todas las direcciones de billetera identificadas</li>
        <li>Identificacion del exchange con recomendaciones de requerimiento judicial</li>
        <li>Puntuacion de riesgo y atribucion de entidades</li>
        <li>Certificacion del investigador y documentacion de la metodologia</li>
      </ul>

      {/* Seccion 4 */}
      <h2 id="obfuscation-techniques">Tecnicas Comunes de Ofuscacion — Y Como los Investigadores las Superan</h2>
      <p>
        Los estafadores saben que existen investigadores. Utilizan tecnicas para ocultar el rastro. Esto es lo que intentan — y como la ciencia forense lo contrarresta.
      </p>

      <h3>Mezcladores y Tumblers (por ejemplo, Tornado Cash)</h3>
      <p>
        <strong>Lo que hacen:</strong> Agrupan criptomonedas de multiples fuentes y redistribuyen montos equivalentes, rompiendo la cadena de transacciones.
      </p>
      <p>
        <strong>Como responden los investigadores:</strong> Las tecnicas modernas de desmezclado analizan el momento, los montos y los patrones de las entradas y salidas del mezclador para rastrear probabilisticamente los fondos a traves del servicio. El desmezclado automatico de Crystal Expert analiza las entradas y salidas del mezclador para identificar hasta cinco rutas candidatas desde el servicio de mezcla en adelante.
      </p>
      <p>
        Ademas, Tornado Cash fue sancionado por la OFAC en 2022 — cualquier exchange que reciba fondos de Tornado Cash esta obligado a congelarlos bajo la ley de sanciones de Estados Unidos.
      </p>

      <h3>Salto de Cadena (Transferencias Cross-Chain)</h3>
      <p>
        <strong>Lo que hacen:</strong> Convierten Bitcoin a Ethereum, luego a USDT, luego a BNB — saltando entre blockchains para confundir a los investigadores.
      </p>
      <p>
        <strong>Como responden los investigadores:</strong> Las herramientas modernas rastrean entre cadenas automaticamente. Las plataformas de inteligencia blockchain como TRM Labs pueden seguir el flujo de fondos, detectar comportamientos sospechosos y vincular la actividad con actores del mundo real — especialmente cuando se combinan con inteligencia fuera de la cadena.
      </p>

      <h3>Cadenas de Pelado (Peel Chains)</h3>
      <p>
        <strong>Lo que hacen:</strong> Envian fondos a traves de una larga cadena de billeteras, cada una transfiriendo la mayor parte de los fondos a la siguiente y reteniendo una pequena cantidad — como pelar una cebolla.
      </p>
      <p>
        <strong>Como responden los investigadores:</strong> Las herramientas automatizadas de mapeo de transacciones siguen las cadenas de pelado automaticamente, sin importar cuantos saltos haya. El patron en si es una senal de alerta que facilita la identificacion de los fondos.
      </p>

      <h3>Criptomonedas de Privacidad (Monero)</h3>
      <p>
        <strong>Lo que hacen:</strong> Utilizan Monero (XMR), que tiene funciones de privacidad integradas que ocultan los detalles de las transacciones.
      </p>
      <p>
        <strong>Como responden los investigadores:</strong> Este es el escenario mas dificil. Las transacciones puras de Monero son extremadamente dificiles de rastrear. Sin embargo, la mayoria de los estafadores eventualmente convierten a Bitcoin o stablecoins para retirar efectivo — y ese punto de conversion es rastreable.
      </p>

      {/* CTA intermedio */}
      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">¿Necesitas Rastrear Fondos Robados?</h3>
        <p className="text-brand-100 text-sm mb-5">Nuestro equipo de investigadores certificados en blockchain puede rastrear tus criptomonedas robadas e identificar hacia donde fueron.</p>
        <Link
          href={`${base}/free-evaluation`}
          className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
        >
          Obtener Evaluacion Gratuita <ArrowRight size={14} />
        </Link>
      </div>

      {/* Seccion 5 */}
      <h2 id="what-you-need">Lo Que Necesitas Para Iniciar un Rastreo</h2>
      <p>
        No necesitas todo esto — pero cuanto mas tengas, mas rapida y completa sera la investigacion:
      </p>

      {/* Cuadro de checklist */}
      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Lista de Verificacion para la Investigacion
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Esencial (al menos uno):</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Direccion de billetera a la que enviaste los fondos</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Hash de transaccion / TX ID</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Nombre de la plataforma o exchange que utilizaste</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Util:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Fechas y montos exactos de cada transferencia</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Capturas de pantalla de tu cuenta en la plataforma</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Comunicaciones con el estafador</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> URL de la plataforma y cualquier dato de registro</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Bonus:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Cualquier nombre, telefono o correo electronico que haya proporcionado el estafador</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Perfiles de redes sociales utilizados en la estafa</li>
          </ul>
        </div>
      </div>

      {/* Seccion 6 */}
      <h2 id="how-long">¿Cuanto Tiempo Toma el Rastreo?</h2>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="font-bold text-slate-800 text-sm mb-1">Rastreo Basico</p>
          <p className="text-xs text-slate-500 mb-2">Una sola blockchain, rastro claro</p>
          <p className="text-2xl font-display font-bold text-brand-600">24-48 Horas</p>
          <p className="text-xs text-slate-500 mt-1">para el informe inicial</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="font-bold text-slate-800 text-sm mb-1">Investigacion Completa</p>
          <p className="text-xs text-slate-500 mb-2">Multi-cadena, enrutamiento complejo</p>
          <p className="text-2xl font-display font-bold text-brand-600">3-7 Dias</p>
          <p className="text-xs text-slate-500 mt-1">dias habiles</p>
        </div>
      </div>

      {/* Cita destacada */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">El Tiempo Es Critico</p>
        <p className="text-sm text-slate-600">
          Actuar dentro de las primeras 72 horas aumenta drasticamente tus posibilidades de recuperacion. Cuanto antes comience un rastreo, mayor sera la probabilidad de encontrar los fondos antes de que sean completamente liquidados, llegar a los exchanges mientras las cuentas aun estan activas y presentar solicitudes de congelamiento de emergencia.
        </p>
      </div>

      {/* Seccion 7 */}
      <h2 id="free-tools">Herramientas Gratuitas Que Puedes Usar Ahora Mismo</h2>
      <p>
        Antes de contratar a un investigador profesional, puedes comenzar a recopilar informacion por tu cuenta usando herramientas gratuitas:
      </p>

      <h3>Exploradores de Blockchain</h3>
      <ul>
        <li><strong>Etherscan.io</strong> — Ethereum, tokens ERC-20, NFTs</li>
        <li><strong>Blockchain.com</strong> — Bitcoin</li>
        <li><strong>BscScan.com</strong> — BNB Chain</li>
        <li><strong>Tronscan.org</strong> — Tron/USDT</li>
      </ul>
      <p>
        Ingresa cualquier direccion de billetera o hash de transaccion para ver el historial completo de transacciones.
      </p>

      <h3>Herramientas Gratuitas de LedgerHound</h3>
      <ul>
        <li><strong><Link href={`${base}/tracker`} className="text-brand-600 hover:text-brand-700">Rastreador de Billeteras</Link></strong> — Ingresa cualquier direccion de Ethereum y consulta el historial completo de transacciones con analiticas</li>
        <li><strong><Link href={`${base}/graph-tracer`} className="text-brand-600 hover:text-brand-700">Graph Tracer</Link></strong> — Visualiza el flujo de fondos como un grafico interactivo e identifica exchanges conocidos</li>
      </ul>
      <p>
        Estas herramientas te muestran los mismos datos on-chain con los que comienzan los investigadores profesionales — aunque el rastreo de nivel profesional requiere bases de datos de atribucion propietarias y metodologia certificada para uso legal.
      </p>

      {/* Seccion 8 */}
      <h2 id="when-to-hire">Cuando Tiene Sentido una Investigacion Profesional</h2>
      <p>
        Las herramientas gratuitas son un punto de partida. La ciencia forense blockchain profesional es necesaria cuando:
      </p>
      <ul>
        <li><strong>Necesitas evidencia de grado legal</strong> — los tribunales requieren metodologia certificada, no capturas de pantalla</li>
        <li><strong>Los fondos han sido mezclados o han saltado de cadena</strong> — requiere herramientas especializadas de desmezclado</li>
        <li><strong>Necesitas presentar un requerimiento judicial a un exchange</strong> — los abogados necesitan un informe forense que identifique el objetivo</li>
        <li><strong>Las fuerzas del orden estan involucradas</strong> — los informes profesionales tienen una autoridad que el analisis casero no posee</li>
        <li><strong>El monto es significativo</strong> — si perdiste $10,000 o mas, la investigacion profesional tipicamente se paga sola</li>
      </ul>

      {/* Seccion 9 */}
      <h2 id="what-happens-after">Que Sucede Despues del Rastreo</h2>
      <p>
        Un rastreo forense exitoso identifica <em>hacia donde</em> fueron los fondos. La recuperacion requiere accion legal:
      </p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Pasos de Recuperacion Despues del Rastreo
        </div>

        <div className="space-y-5">
          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
              Requerimiento Judicial al Exchange
            </p>
            <p className="text-sm text-slate-600 ml-8">Tu abogado presenta un requerimiento judicial al exchange identificado para obtener la informacion del titular de la cuenta. La mayoria de los principales exchanges cumplen en un plazo de 2 a 4 semanas.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
              Solicitud de Congelamiento de Emergencia
            </p>
            <p className="text-sm text-slate-600 ml-8">Muchos exchanges congelaran voluntariamente las cuentas cuando se les presenta un informe forense profesional y una referencia de las fuerzas del orden, incluso antes de un requerimiento judicial formal.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
              Litigio Civil
            </p>
            <p className="text-sm text-slate-600 ml-8">Con el titular de la cuenta identificado, se pueden presentar demandas civiles por fraude, apropiacion indebida y enriquecimiento injusto.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
              Referencia a las Fuerzas del Orden
            </p>
            <p className="text-sm text-slate-600 ml-8">El FBI IC3 y las autoridades estatales actuan en base a informes forenses. Los casos significativos pueden calificar para el Equipo de Recuperacion de Activos (RAT) del FBI, que tiene autoridad para el congelamiento de emergencia de activos.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">5</span>
              Procedimientos de Decomiso del DOJ
            </p>
            <p className="text-sm text-slate-600 ml-8">En casos vinculados al crimen organizado, los procedimientos de decomiso del DOJ pueden resultar en la distribucion de fondos a las victimas.</p>
          </div>
        </div>
      </div>

      {/* Comienza tu rastreo */}
      <h2>Inicia Tu Rastreo Hoy</h2>
      <p>
        <strong>LedgerHound</strong> proporciona investigaciones forenses certificadas de blockchain para victimas de robo y fraude con criptomonedas. Nuestro equipo:
      </p>
      <ul>
        <li>Rastrea fondos robados en todas las principales blockchains</li>
        <li>Identifica los exchanges y entidades que recibieron tus fondos</li>
        <li>Entrega informes forenses listos para tribunales en 48-72 horas</li>
        <li>Apoya el proceso de requerimientos judiciales de abogados y referencias a las fuerzas del orden</li>
        <li>Realiza consultas en ruso, ingles, espanol, chino, frances y arabe</li>
      </ul>
    </>
  );
}
