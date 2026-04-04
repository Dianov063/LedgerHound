import Link from 'next/link';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ContentEs({ base }: { base: string }) {
  return (
    <>
      {/* Intro */}
      <p className="text-lg text-slate-700 leading-relaxed">
        Conociste a alguien en internet hace unos meses. Tal vez en LinkedIn, Instagram o una app de citas. Era amable, interesante y nunca insistente. A lo largo de semanas, construiste una conexi&oacute;n real: mensajes diarios, llamadas telef&oacute;nicas, quiz&aacute;s incluso videollamadas.
      </p>
      <p>
        Luego, un d&iacute;a, casi de manera casual, mencion&oacute; que estaba ganando mucho dinero operando con criptomonedas. Te mostr&oacute; su cuenta. Los n&uacute;meros eran incre&iacute;bles. Se ofreci&oacute; a ayudarte a empezar.
      </p>
      <p>
        Invertiste un poco. Funcion&oacute;. Invertiste m&aacute;s. Segu&iacute;a funcionando. Luego intentaste retirar fondos y todo se detuvo.
      </p>
      <p>
        Si esto te resulta familiar, es posible que seas v&iacute;ctima de una estafa de tipo <strong>pig butchering</strong> (literalmente &quot;matanza del cerdo&quot;) &mdash; la forma de fraude con criptomonedas m&aacute;s devastadora econ&oacute;micamente en el mundo actual.
      </p>

      {/* Section 1 */}
      <h2 id="what-is">&iquest;Qu&eacute; es una estafa de tipo Pig Butchering?</h2>
      <p>
        El t&eacute;rmino proviene de la frase china <em>sh&amacr; zh&umacr; p&aacute;n</em> (杀猪盘) &mdash; que literalmente significa &quot;plato de matanza del cerdo&quot;. El nombre refleja la estrategia: los estafadores &quot;engordan&quot; a las v&iacute;ctimas con peque&ntilde;as ganancias iniciales e inversi&oacute;n emocional antes de la &quot;matanza&quot; final &mdash; el robo total de todo lo depositado.
      </p>
      <p>
        Estas no son estafas r&aacute;pidas ni oportunistas. Son operaciones de confianza de larga duraci&oacute;n, que a menudo duran semanas o meses, ejecutadas por redes criminales organizadas con base principalmente en el sudeste asi&aacute;tico.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">$9.3 mil millones</p>
        <p className="text-sm text-slate-600">
          en p&eacute;rdidas reportadas por denuncias relacionadas con criptomonedas ante el IC3 del FBI en 2024 &mdash; un aumento del 66% respecto al a&ntilde;o anterior. El fraude de inversiones represent&oacute; $5.8 mil millones de ese total.
        </p>
      </div>

      <p>
        Seg&uacute;n el Informe de Delitos Cripto 2026 de TRM, aproximadamente $35 mil millones se enviaron a esquemas de fraude en 2025, siendo las estafas de pig butchering una proporci&oacute;n significativa.
      </p>

      {/* Section 2 */}
      <h2 id="how-it-works">C&oacute;mo funcionan las estafas Pig Butchering: El manual completo</h2>

      <h3>Fase 1: La preparaci&oacute;n (Semanas 1&ndash;4)</h3>
      <p>
        El contacto comienza de forma inocua. Un mensaje en WhatsApp de un n&uacute;mero equivocado. Una nueva solicitud de conexi&oacute;n en LinkedIn. Un match en una app de citas. El estafador &mdash; que a menudo opera desde un centro de trabajo forzado en Camboya, Myanmar o Laos &mdash; se presenta como un profesional exitoso, generalmente asi&aacute;tico-estadounidense, frecuentemente atractivo, siempre encantador.
      </p>
      <p>
        En esta fase no se menciona el dinero ni las inversiones. El objetivo es simplemente construir una relaci&oacute;n. Mensajes diarios de buenos d&iacute;as. Compartir comidas por videollamada. Hablar sobre familia, sue&ntilde;os y el futuro.
      </p>

      <h3>Fase 2: La introducci&oacute;n (Semanas 4&ndash;8)</h3>
      <p>
        Una vez establecida la confianza, el estafador menciona &quot;accidentalmente&quot; su &eacute;xito en inversiones. Es reticente a hablar de ello &mdash; no quiere parecer presumido. Pero t&uacute; preguntas. Te explica que su t&iacute;o trabaja en una empresa de criptomonedas y le ense&ntilde;&oacute; un m&eacute;todo especial de trading.
      </p>
      <p>
        Se ofrece a mostrarte &mdash; solo para ayudar, sin ning&uacute;n beneficio propio. Te gu&iacute;a para crear una cuenta en una plataforma que nunca hab&iacute;as escuchado. La plataforma se ve completamente profesional: gr&aacute;ficos en tiempo real, chat de soporte al cliente, una aplicaci&oacute;n m&oacute;vil elegante.
      </p>
      <p>
        Depositas una peque&ntilde;a cantidad. Ves c&oacute;mo crece. Retiras un poco &mdash; funciona, al instante. Est&aacute;s convencido.
      </p>

      <h3>Fase 3: El engorde (Semanas 8&ndash;20)</h3>
      <p>
        Ahora los montos de inversi&oacute;n aumentan. El estafador te anima a depositar m&aacute;s &mdash; &quot;el mercado se est&aacute; moviendo, esta es una oportunidad &uacute;nica en el a&ntilde;o&quot;. Deposita su propio dinero junto al tuyo (falso, por supuesto &mdash; todo est&aacute; en una plataforma fraudulenta que ellos controlan).
      </p>
      <p>
        Tu cuenta muestra rendimientos extraordinarios. Ganancias del 30%, 50%, 100%. Compartes las capturas de pantalla con amigos. Sientes que finalmente encontraste la libertad financiera.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">Aumento del 253%</p>
        <p className="text-sm text-slate-600">
          en el monto promedio de pago por estafa de 2024 a 2025 &mdash; creciendo de $782 a $2,764 por transacci&oacute;n a medida que los estafadores continuaron adapt&aacute;ndose e innovando.
        </p>
      </div>

      <h3>Fase 4: La matanza</h3>
      <p>
        Cuando intentas retirar una cantidad significativa, algo sale mal. Hay una &quot;retenci&oacute;n fiscal&quot;. Una &quot;comisi&oacute;n de verificaci&oacute;n&quot;. Un &quot;dep&oacute;sito de cumplimiento normativo&quot; requerido por las regulaciones. Te dicen que necesitas depositar m&aacute;s dinero para desbloquear tus fondos.
      </p>
      <p>
        Algunas v&iacute;ctimas pagan estas comisiones &mdash; a veces m&uacute;ltiples veces &mdash; antes de darse cuenta de que la plataforma es fraudulenta. Para cuando el estafador desaparece, las p&eacute;rdidas suelen alcanzar cifras de seis d&iacute;gitos.
      </p>
      <p>
        El IRS se&ntilde;ala que las p&eacute;rdidas frecuentemente alcanzan cientos de miles de d&oacute;lares, con algunas v&iacute;ctimas perdiendo hasta $2 millones.
      </p>

      {/* Section 3 */}
      <h2 id="who-are-scammers">&iquest;Qui&eacute;nes son los estafadores?</h2>
      <p>
        Esto no es un criminal solitario en un s&oacute;tano. El pig butchering es una operaci&oacute;n industrial.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">M&aacute;s de 200,000 personas</p>
        <p className="text-sm text-slate-600">
          seg&uacute;n estimaciones de las Naciones Unidas, est&aacute;n retenidas en centros de estafa en todo el sudeste asi&aacute;tico &mdash; muchas son ellas mismas v&iacute;ctimas de trata de personas, obligadas a perpetrar fraudes bajo amenaza de violencia.
        </p>
      </div>

      <p>
        Las personas que te env&iacute;an mensajes pueden ser ellas mismas v&iacute;ctimas &mdash; secuestradas o traficadas y obligadas a ejecutar estas estafas bajo amenaza de da&ntilde;o f&iacute;sico. Los verdaderos beneficiarios son las redes criminales organizadas que operan los centros.
      </p>
      <p>
        Chainalysis identific&oacute; conexiones persistentes entre estafas de criptomonedas y operaciones basadas en Asia Oriental y el Sudeste Asi&aacute;tico, con la inteligencia artificial siendo cada vez m&aacute;s incorporada en las operaciones de estafa &mdash; incluyendo voces deepfake generadas por IA y herramientas sofisticadas de ingenier&iacute;a social.
      </p>

      {/* Section 4 - Warning signs (yellow box) */}
      <h2 id="warning-signs">Se&ntilde;ales de alerta de una estafa Pig Butchering</h2>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Se&ntilde;ales de alerta a tener en cuenta
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">C&oacute;mo se establece el contacto:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Mensaje no solicitado de un n&uacute;mero desconocido (&quot;n&uacute;mero equivocado&quot; que accidentalmente te contacta)</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Desconocido sospechosamente atractivo te conecta en LinkedIn o una app de citas</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> El contacto escala r&aacute;pidamente a mensajes diarios e intimidad emocional</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">La propuesta de inversi&oacute;n:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Mencionan ganancias en cripto de forma casual, no como un discurso de ventas</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Se ofrecen a &quot;ayudarte&quot; &mdash; no a venderte nada</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> La plataforma que recomiendan es una que nunca has escuchado</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Los primeros retiros peque&ntilde;os funcionan perfectamente (por dise&ntilde;o)</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">Se&ntilde;ales de alerta en la plataforma:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> No se encuentra en las tiendas de aplicaciones &mdash; requiere descarga desde un enlace</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Soporte al cliente solo por chat, nunca por tel&eacute;fono</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> El retiro requiere dep&oacute;sitos adicionales (&quot;impuesto&quot;, &quot;comisi&oacute;n de cumplimiento&quot;)</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Las ganancias parecen imposiblemente altas sin explicaci&oacute;n de riesgos</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">La relaci&oacute;n:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Rechazan videollamadas o usan video pregrabado (deepfakes)</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Evitan reunirse en persona a pesar de una fuerte conexi&oacute;n emocional</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Se vuelven insistentes cuando dudas en invertir m&aacute;s</li>
          </ul>
        </div>
      </div>

      {/* Section 5 - What to do (green box) */}
      <h2 id="what-to-do">Qu&eacute; hacer si has sido estafado</h2>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Pasos a seguir para las v&iacute;ctimas
        </div>

        <div className="space-y-5">
          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
              Detener todas las transferencias inmediatamente
            </p>
            <p className="text-sm text-slate-600 ml-8">No env&iacute;es m&aacute;s dinero, independientemente de lo que te digan. Cualquier &quot;comisi&oacute;n para desbloquear fondos&quot; es otra capa de la estafa. No existen comisiones leg&iacute;timas que requieran que las v&iacute;ctimas depositen m&aacute;s criptomonedas.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
              Preservar todas las pruebas
            </p>
            <p className="text-sm text-slate-600 ml-8">Captura pantalla de todo antes de que el estafador desaparezca: todas las conversaciones de chat (WhatsApp, Telegram, WeChat, Line), la URL de la plataforma fraudulenta y capturas de tu cuenta, todos los registros de transacciones y direcciones de billeteras, las fotos de perfil e informaci&oacute;n de contacto del estafador.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
              Denunciar ante las autoridades
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-1">
              <p><strong>FBI IC3:</strong> ic3.gov &mdash; presenta una denuncia detallada con toda la informaci&oacute;n de las transacciones</p>
              <p><strong>FTC:</strong> reportfraud.ftc.gov</p>
              <p><strong>La fiscal&iacute;a general de tu estado</strong></p>
            </div>
          </div>

          <div className="not-prose ml-8 my-4 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">Operaci&oacute;n Level Up del FBI</p>
            <p className="text-xs text-slate-600">Ha notificado a m&aacute;s de 8,103 v&iacute;ctimas de fraude de inversi&oacute;n en criptomonedas, de las cuales el 77% desconoc&iacute;a que estaba siendo estafada. Ahorro estimado: m&aacute;s de $511 millones gracias a la intervenci&oacute;n temprana.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
              Obtener una investigaci&oacute;n forense de blockchain
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-2">
              <p>Aqu&iacute; es donde la ayuda profesional marca una diferencia real. Cada transacci&oacute;n de criptomonedas queda registrada permanentemente en la blockchain &mdash; incluyendo las tuyas. Un investigador certificado puede:</p>
              <ul className="space-y-1">
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Rastrear exactamente a d&oacute;nde fueron tus fondos despu&eacute;s de enviarlos</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Identificar qu&eacute; exchanges recibieron las criptomonedas robadas</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Elaborar un informe forense con validez judicial que documente el flujo completo de fondos</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Identificar objetivos para citaciones judiciales (exchanges con cumplimiento KYC)</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Apoyar a las fuerzas del orden y a tu abogado con inteligencia accionable</li>
              </ul>
              <p className="font-semibold text-slate-700 mt-2">Cuanto antes se haga, mejor. Los fondos que llegan a un exchange pueden ser potencialmente congelados, pero solo si se identifican y reportan r&aacute;pidamente.</p>
            </div>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">5</span>
              Consultar a un abogado
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-1">
              <p>Un abogado con experiencia en fraude de criptomonedas puede:</p>
              <p>&bull; Presentar mandamientos judiciales de congelaci&oacute;n de emergencia contra los exchanges identificados</p>
              <p>&bull; Iniciar procedimientos de decomiso civil contra los fondos incautados</p>
              <p>&bull; Conectarte con los procedimientos de decomiso del DOJ correspondientes, si aplica</p>
            </div>
          </div>
        </div>
      </div>

      <p>
        En un caso notable, la Fiscal&iacute;a Federal de Massachusetts present&oacute; una acci&oacute;n de decomiso civil para recuperar aproximadamente $2.3 millones en criptomonedas rastreadas hasta un esquema de pig butchering dirigido contra un residente local.
      </p>

      {/* Mid-article CTA */}
      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">Obt&eacute;n una evaluaci&oacute;n gratuita de tu caso</h3>
        <p className="text-brand-100 text-sm mb-5">Nuestro equipo puede rastrear tus fondos robados y proporcionarte un informe forense con validez judicial.</p>
        <Link
          href={`${base}/free-evaluation`}
          className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
        >
          Evaluaci&oacute;n gratuita &rarr;
        </Link>
      </div>

      {/* Section 6 */}
      <h2 id="recovery">&iquest;Puedes recuperar tu dinero?</h2>
      <p>
        Esta es la pregunta que toda v&iacute;ctima hace. La respuesta honesta: depende de varios factores.
      </p>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> Aumenta las probabilidades de recuperaci&oacute;n</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>&bull; Denunciar r&aacute;pidamente (dentro de d&iacute;as o semanas)</li>
            <li>&bull; Tener las direcciones de billeteras y hashes de transacciones</li>
            <li>&bull; Los fondos terminaron en un exchange con cumplimiento KYC</li>
            <li>&bull; Acci&oacute;n forense + legal coordinada</li>
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Reduce las probabilidades de recuperaci&oacute;n</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>&bull; Los fondos pasaron por un mixer o criptomoneda de privacidad</li>
            <li>&bull; Ha transcurrido un tiempo significativo desde el robo</li>
            <li>&bull; Los fondos se movieron a exchanges no regulados</li>
            <li>&bull; No hay documentaci&oacute;n de las transacciones</li>
          </ul>
        </div>
      </div>

      <p>
        Incluso cuando la recuperaci&oacute;n total no es posible, una investigaci&oacute;n forense proporciona documentaci&oacute;n para fines fiscales (deducciones por p&eacute;rdidas por robo), evidencia para procedimientos penales de las fuerzas del orden y contribuci&oacute;n a los fondos de decomiso del DOJ que se distribuyen entre las v&iacute;ctimas.
      </p>

      {/* Section 7 */}
      <h2 id="law-enforcement">Las fuerzas del orden est&aacute;n mejorando en esto</h2>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">M&aacute;s de $400 millones</p>
        <p className="text-sm text-slate-600">
          en criptomonedas ya incautadas por el Scam Center Strike Force del DOJ, establecido en noviembre de 2025, enfocado espec&iacute;ficamente en investigar y enjuiciar las operaciones de centros de estafa del sudeste asi&aacute;tico.
        </p>
      </div>

      <p>
        El DOJ incaut&oacute; $61 millones en USDT vinculados a estafas de pig butchering en Carolina del Norte &mdash; demostrando que, a pesar de los intentos de lavado a trav&eacute;s de billeteras y blockchains, los investigadores pueden rastrear las transacciones e identificar las billeteras de consolidaci&oacute;n que contienen fondos de las v&iacute;ctimas.
      </p>
      <p>
        Las herramientas disponibles para los investigadores &mdash; y la cooperaci&oacute;n entre empresas de an&aacute;lisis de blockchain y las fuerzas del orden &mdash; est&aacute;n mejorando r&aacute;pidamente. Las v&iacute;ctimas que documentan y denuncian correctamente sus casos contribuyen a acciones de aplicaci&oacute;n de la ley m&aacute;s amplias que benefician a toda la comunidad de v&iacute;ctimas.
      </p>

      {/* Section 8 */}
      <h2 id="getting-help">C&oacute;mo obtener ayuda</h2>
      <p>
        Si t&uacute; o alguien que conoces ha sido afectado por una estafa de pig butchering, no esperes. El rastro en la blockchain se vuelve m&aacute;s dif&iacute;cil de seguir con el tiempo, y los exchanges tienen ventanas limitadas para congelaciones de emergencia.
      </p>

      <p>
        <strong>LedgerHound</strong> ofrece investigaciones forenses certificadas de blockchain para v&iacute;ctimas de fraude con criptomonedas. Nuestro equipo:
      </p>
      <ul>
        <li>Rastrea fondos robados a trav&eacute;s de todas las principales blockchains</li>
        <li>Identifica los exchanges y entidades que recibieron tus fondos</li>
        <li>Entrega informes forenses con validez judicial para abogados y fuerzas del orden</li>
        <li>Trabaja directamente con clientes de habla rusa &mdash; sin necesidad de traductores</li>
        <li>Proporciona una evaluaci&oacute;n de caso gratuita y confidencial en 24 horas</li>
      </ul>
    </>
  );
}
