import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ContentEs({ base }: { base: string }) {
  return (
    <>
              {/* Intro */}
              <p className="text-lg text-slate-700 leading-relaxed">
                Encontraste una plataforma de trading de criptomonedas a través de alguien que conociste en línea. La interfaz se ve profesional. Tu cuenta muestra rendimientos impresionantes. Incluso realizaste un pequeño retiro que funcionó perfectamente.
              </p>
              <p>
                Luego intentas retirar tus ganancias reales — y todo se detiene.
              </p>
              <p>
                Este es el momento decisivo de uno de los fraudes financieros más sofisticados de nuestra era. Los exchanges de criptomonedas falsos se han convertido en una de las herramientas más efectivas utilizadas por redes de fraude organizadas. Estas plataformas están diseñadas para parecer legítimas, a menudo imitando exchanges reales y mostrando saldos de cuenta fabricados para crear la ilusión de trading activo y ganancias consistentes.
              </p>
              <p>
                En 2026, estas plataformas son más convincentes que nunca — y lo que está en juego nunca ha sido mayor.
              </p>

              {/* Scale */}
              <h2 id="scale">La Magnitud del Problema</h2>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">$17 Mil Millones</p>
                <p className="text-sm text-slate-600">
                  en pérdidas por estafas de criptomonedas en 2025, con estafas de suplantación de identidad e ingeniería social impulsadas por IA aumentando un 1,400% interanual.
                </p>
              </div>

              <p>
                Según el Informe de Crimen Cripto 2026 de TRM, aproximadamente $35 mil millones fueron enviados a esquemas de fraude en 2025, y las estafas de pig butchering representaron una parte significativa.
              </p>
              <p>
                Las plataformas de trading falsas están en el centro de la mayoría de estas pérdidas. No son estafas burdas y obvias — son productos de software sofisticados construidos por redes criminales organizadas específicamente para engañar.
              </p>

              {/* How they work */}
              <h2 id="how-they-work">Cómo Funcionan las Plataformas Falsas</h2>
              <p>
                Comprender los mecanismos te ayuda a reconocerlas antes de que sea demasiado tarde.
              </p>

              <h3>Paso 1: La Introducción</h3>
              <p>
                Estos esquemas están altamente coordinados y típicamente comienzan con contacto no solicitado a través de mensajes de texto, redes sociales o aplicaciones de citas. Con el tiempo, los estafadores construyen confianza y gradualmente introducen oportunidades de inversión en criptomonedas que parecen creíbles y de bajo riesgo.
              </p>
              <p>
                La plataforma nunca es lo primero que te muestran. La relación viene primero — a veces semanas o meses de conversación diaria, intereses compartidos y conexión emocional.
              </p>

              <h3>Paso 2: La Demostración de la Plataforma</h3>
              <p>
                Una vez que se establece la confianza, tu contacto se ofrece a mostrarte cómo invierte. Te guían a una plataforma específica — una que nunca has escuchado, a la que se accede a través de un enlace que te envían o una aplicación descargada fuera de las tiendas de aplicaciones oficiales.
              </p>
              <p>
                Las víctimas a menudo son guiadas paso a paso para "aprender" a invertir en criptomonedas a través de aplicaciones de trading falsas, sitios web de exchanges clonados o cuentas de demostración que muestran ganancias fabricadas.
              </p>

              <h3>Paso 3: La Prueba</h3>
              <p>
                Depositas una pequeña cantidad. La ves crecer. Retiras una pequeña cantidad — y funciona. Esto es por diseño.
              </p>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">Por Diseño</p>
                <p className="text-sm text-slate-600">
                  Los saldos de las cuentas aumentan, las operaciones parecen ejecutarse y se permiten pequeños retiros para reforzar la ilusión de legitimidad. A medida que crece la confianza, se anima a las víctimas a invertir cantidades mayores.
                </p>
              </div>

              <h3>Paso 4: La Trampa</h3>
              <p>
                Cuando intentas un retiro significativo, la plataforma genera un obstáculo. Una retención fiscal. Una verificación de cumplimiento. Una "tarifa de liquidez." Cuando las víctimas intentan retirar, la plataforma añade fricción, exigiendo pagos adicionales presentados como impuestos, verificaciones de cumplimiento, actualizaciones o tarifas de verificación — manteniendo a la víctima pagando mientras los fondos se desvían.
              </p>

              <h3>Paso 5: La Salida</h3>
              <p>
                Una vez que han extraído el máximo de fondos, la plataforma desaparece — junto con tu contacto, su perfil y toda forma de comunicarse con ellos.
              </p>

              {/* Mid-article CTA */}
              <div className="not-prose my-10 bg-brand-50 border border-brand-200 rounded-xl p-6 text-center">
                <AlertTriangle className="mx-auto text-brand-600 mb-2" size={24} />
                <p className="font-display font-bold text-brand-800 mb-1">¿Crees que podrías estar tratando con una plataforma falsa?</p>
                <p className="text-sm text-brand-600 mb-4">Obtén una evaluación de caso gratuita y confidencial en 24 horas. Sin obligación, sin costo inicial.</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Obtener Evaluación Gratuita <ArrowRight size={14} />
                </Link>
              </div>

              {/* 10 Warning Signs */}
              <h2 id="warning-signs">10 Señales de Advertencia de una Plataforma de Trading de Criptomonedas Falsa</h2>

              <h3>1. Fuiste Dirigido Allí por Alguien que Conociste en Línea</h3>
              <p>
                Las plataformas legítimas no necesitan que alguien te reclute personalmente. Si una persona que conociste en línea — especialmente alguien que parecía inusualmente interesado en tu situación financiera — te dirigió a una plataforma específica, trátalo como una señal de alerta seria.
              </p>

              <h3>2. La Aplicación No Está en las Tiendas de Aplicaciones Oficiales</h3>
              <p>
                Exchanges reales como Coinbase, Kraken y Binance están disponibles en la Apple App Store y Google Play con miles de reseñas verificadas. Las plataformas falsas típicamente requieren que:
              </p>
              <ul>
                <li>Descargues un archivo APK directamente desde un enlace</li>
                <li>Uses una aplicación de navegador web sin listado en la tienda de aplicaciones</li>
                <li>Instales una "versión especial" para mejores rendimientos</li>
              </ul>

              <h3>3. La URL Se Ve Casi Correcta</h3>
              <p>
                Los estafadores registran dominios que imitan de cerca a exchanges legítimos. Las tácticas comunes incluyen:
              </p>
              <ul>
                <li>Añadir palabras: <code>coinbase-pro-trading.com</code></li>
                <li>Cambiar terminaciones: <code>binance.cc</code> en lugar de <code>binance.com</code></li>
                <li>Usar guiones: <code>kraken-exchange.net</code></li>
              </ul>
              <p>
                Siempre verifica la URL exacta contra el sitio web oficial. Guarda en marcadores los exchanges legítimos directamente.
              </p>

              <h3>4. Los Rendimientos Son Garantizados o Consistentemente Altos</h3>
              <p>
                Ninguna inversión legítima garantiza rendimientos. Cuando escuchas sobre rendimientos "garantizados" en criptomonedas, probablemente estás tratando con un individuo o negocio poco confiable, según la Federal Trade Commission.
              </p>
              <p>
                Las plataformas falsas típicamente muestran rendimientos del 10–40% mensual — cifras que serían imposibles de mantener en mercados reales.
              </p>

              <h3>5. Los Retiros Requieren Pagos Adicionales</h3>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <p className="text-xl font-display font-bold text-red-900 mb-2">El Indicador #1 de una Estafa</p>
                <p className="text-sm text-red-700">
                  Las demandas de "tarifas" o "pagos de verificación" adicionales nunca resultan en acceso a la cuenta. Cada pago lleva a nuevas excusas, aumentando las pérdidas mientras las víctimas intentan recuperar sus depósitos.
                </p>
              </div>

              <p>
                Los exchanges legítimos <strong>nunca</strong> requieren que deposites más dinero para retirar tus fondos existentes. Si encuentras cualquiera de estos:
              </p>
              <ul>
                <li>"Pago de impuestos requerido para liberar fondos"</li>
                <li>"Tarifa de verificación de cumplimiento"</li>
                <li>"Depósito de liquidez para procesar el retiro"</li>
                <li>"Tarifa de autorización contra lavado de dinero"</li>
              </ul>
              <p>
                <strong>Estás siendo estafado. Detén todos los pagos inmediatamente.</strong>
              </p>

              <h3>6. Atención al Cliente Solo por Chat</h3>
              <p>
                Las plataformas falsas típicamente no tienen número de teléfono, dirección física ni registro de empresa verificable — soporte solo a través de chat en la plataforma o Telegram. Los exchanges reales tienen registro corporativo verificable, direcciones publicadas y múltiples canales de contacto.
              </p>

              <h3>7. La Plataforma No Se Encuentra en Bases de Datos de la Industria</h3>
              <p>
                Verifica la plataforma contra:
              </p>
              <ul>
                <li><strong>CoinGecko</strong> y <strong>CoinMarketCap</strong> — los exchanges legítimos están listados</li>
                <li><strong>DFPI Scam Tracker</strong> (Departamento de Protección Financiera de California)</li>
                <li><strong>FCA Register</strong> (Autoridad de Conducta Financiera del Reino Unido)</li>
                <li><strong>FINRA BrokerCheck</strong> (EE.UU.)</li>
              </ul>
              <p>
                Si la plataforma no aparece en ninguna base de datos regulatoria, no es un servicio financiero registrado.
              </p>

              <h3>8. Perfiles Generados por IA y Deepfakes</h3>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">4.5x Más Dinero</p>
                <p className="text-sm text-slate-600">
                  extraído por operación en estafas habilitadas por IA en comparación con estafas tradicionales. En 2026, la persona que te presentó la plataforma puede que ni siquiera sea humana.
                </p>
              </div>

              <p>
                Señales de advertencia de personas generadas por IA:
              </p>
              <ul>
                <li>Fotos de perfil que se ven ligeramente artificiales (rostros generados por IA)</li>
                <li>Videollamadas que son pregrabadas o usan tecnología deepfake</li>
                <li>Conversación con guion que se siente ligeramente extraña</li>
                <li>Negativa a hacer video en vivo espontáneo</li>
              </ul>

              <h3>9. Presión para Invertir Más</h3>
              <p>
                Los asesores de inversión legítimos no te presionan. Los operadores de plataformas falsas crean urgencia:
              </p>
              <ul>
                <li>"Esta ventana de trading cierra en 48 horas"</li>
                <li>"Te perderás la subida si no agregas fondos ahora"</li>
                <li>"Yo estoy poniendo $50,000 — tú deberías también"</li>
              </ul>
              <p>
                Esta presión psicológica está diseñada para anular tu juicio racional.
              </p>

              <h3>10. Sin Historial de Transacciones Rastreable</h3>
              <p>
                Cuando envías criptomonedas a una plataforma falsa, salen inmediatamente. En un exchange real, tus fondos permanecen en tu cuenta.
              </p>
              <p>
                Puedes verificar esto: usa nuestro <Link href={`${base}/wallet-tracker`} className="text-brand-600 font-semibold hover:underline">Rastreador de Billeteras</Link> gratuito para verificar la dirección de destino. Si los fondos transferidos a la billetera de la plataforma se movieron inmediatamente a otras direcciones en lugar de quedarse en una reserva de la plataforma, estás tratando con una estafa.
              </p>

              {/* Technical Red Flags */}
              <h2 id="technical-red-flags">Señales Técnicas de Alerta</h2>
              <p>
                Para quienes se sienten cómodos con el análisis de blockchain:
              </p>
              <p>
                <strong>Verifica la dirección de la billetera en la cadena.</strong> Los exchanges legítimos mantienen grandes billeteras de reserva con miles de transacciones a lo largo de los años. Las billeteras de estafas típicamente:
              </p>
              <ul>
                <li>Fueron creadas recientemente (hace días o semanas)</li>
                <li>Muestran un patrón de recibir fondos e inmediatamente reenviarlos</li>
                <li>No tienen historial de transacciones a largo plazo</li>
              </ul>
              <p>
                <strong>Usa nuestro <Link href={`${base}/scam-checker`} className="text-brand-600 font-semibold hover:underline">Verificador de Estafas</Link> gratuito.</strong> Mantenemos una base de datos de direcciones fraudulentas conocidas con referencias cruzadas de informes de Chainabuse y listas de sanciones de la OFAC.
              </p>
              <p>
                <strong>Busca la identificación del exchange.</strong> Ejecuta la dirección de destino a través de nuestro <Link href={`${base}/graph-tracer`} className="text-brand-600 font-semibold hover:underline">Graph Tracer</Link>. Si los fondos fluyen inmediatamente a mezcladores de privacidad o exchanges offshore no regulados en lugar de plataformas principales que cumplen con KYC, es un fuerte indicador de fraude.
              </p>

              {/* Real Case */}
              <h2 id="real-case">Caso Real: Hombre de Georgia Pierde $164,000</h2>
              <p>
                Un hombre de Georgia conoció a una mujer que se hacía llamar "Hnin Phyu" en Facebook en junio de 2025. Ella rápidamente trasladó su conversación a Telegram y le presentó la inversión en criptomonedas. Él confió en ella y siguió sus instrucciones para configurar cuentas en Crypto.com y un servicio de billetera digital antes de transferir su dinero a un sitio web de trading falso que mostraba ganancias fabricadas.
              </p>
              <p>
                Cuando intentó retirar su dinero, los estafadores le dijeron que debía pagar $50,000 adicionales en impuestos y tarifas para liberar sus fondos. Las pérdidas totales superaron los $164,000.
              </p>
              <p>
                La <strong>Operación Silent Freeze</strong> del FBI, lanzada en octubre de 2025, está específicamente dirigida a esquemas de fraude con criptomonedas — pero la prevención sigue siendo mucho más efectiva que la recuperación.
              </p>

              {/* If already sent money */}
              <h2 id="already-sent">Si Ya Enviaste Dinero</h2>

              <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <p className="text-xl font-display font-bold text-red-900 mb-2">Detente Inmediatamente</p>
                <p className="text-sm text-red-700">
                  No envíes fondos adicionales sin importar lo que te digan. Cada pago adicional va directamente a los estafadores.
                </p>
              </div>

              <p>
                <strong>Preserva toda la evidencia:</strong>
              </p>
              <ul>
                <li>Capturas de pantalla de la plataforma y el saldo de tu cuenta</li>
                <li>Todas las conversaciones de chat con la persona que te presentó</li>
                <li>Registros de transacciones y direcciones de billeteras</li>
                <li>La URL de la plataforma y cualquier credencial de cuenta</li>
              </ul>

              <p>
                <strong>Reporta inmediatamente:</strong>
              </p>
              <ul>
                <li>FBI IC3 en <strong>ic3.gov</strong> (incluye todas las direcciones de billeteras)</li>
                <li>FTC en <strong>reportfraud.ftc.gov</strong></li>
                <li>El fiscal general de tu estado</li>
              </ul>

              <p>
                <strong>Obtén una investigación forense de blockchain.</strong> Los datos muestran que congelar activos ha sido el mejor paso para ayudar a detener las pérdidas. En muchos casos donde los fondos todavía estaban bajo el control de la billetera del atacante, aproximadamente el 75% de los activos fueron congelados exitosamente.
              </p>
              <p>
                El tiempo es crítico. Cada hora que pasa, los fondos se mueven más lejos a través de la blockchain y se vuelven más difíciles de rastrear y congelar.
              </p>

              {/* Getting Help */}
              <h2 id="getting-help">Obtener Ayuda</h2>
              <p>
                Si has sido víctima de una plataforma de trading falsa, <strong>LedgerHound</strong> proporciona investigaciones forenses de blockchain certificadas.
              </p>

              <div className="not-prose my-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
                <p className="font-display font-bold text-slate-900 mb-4">Nosotros:</p>
                <div className="space-y-3">
                  {[
                    'Rastreamos tus fondos a través de todas las principales blockchains',
                    'Identificamos qué exchanges recibieron la criptomoneda robada',
                    'Elaboramos un informe forense listo para tribunales que documenta el flujo completo de fondos',
                    'Apoyamos el proceso de citación de tu abogado',
                    'Proporcionamos consultas en ruso, inglés, español, chino, francés y árabe',
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
                  Obtén Tu Evaluación de Caso Gratuita →
                </Link>
              </p>
              <p>
                Gratis. Confidencial. Sin obligación. Respuesta en 24 horas.
              </p>
    </>
  );
}
