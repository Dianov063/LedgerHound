import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ContentZh({ base }: { base: string }) {
  return (
    <>
              {/* 引言 */}
              <p className="text-lg text-slate-700 leading-relaxed">
                你通过网上认识的人找到了一个加密货币交易平台。界面看起来很专业。你的账户显示着令人印象深刻的回报。你甚至成功进行了一笔小额提现。
              </p>
              <p>
                然后你试图提取真正的利润——一切都停止了。
              </p>
              <p>
                这是我们这个时代最复杂的金融欺诈之一的决定性时刻。虚假加密货币交易所已成为有组织欺诈网络使用的最有效工具之一。这些平台被设计成看起来合法的样子，通常模仿真正的交易所，并显示伪造的账户余额，以制造活跃交易和持续盈利的假象。
              </p>
              <p>
                到2026年，这些平台比以往任何时候都更具欺骗性——风险也从未如此之高。
              </p>

              {/* 规模 */}
              <h2 id="scale">问题的规模</h2>

              {/* 醒目引用 */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">170亿美元</p>
                <p className="text-sm text-slate-600">
                  2025年加密货币诈骗损失金额，其中人工智能驱动的冒充和社会工程诈骗同比增长了1,400%。
                </p>
              </div>

              <p>
                根据TRM的2026年加密犯罪报告，2025年约有350亿美元被转入欺诈计划，其中"杀猪盘"骗局占了相当大的份额。
              </p>
              <p>
                虚假交易平台是大多数此类损失的核心。它们不是粗糙、明显的骗局——它们是由有组织犯罪网络专门为欺骗而构建的复杂软件产品。
              </p>

              {/* 运作方式 */}
              <h2 id="how-they-work">虚假平台如何运作</h2>
              <p>
                了解其运作机制有助于你在为时已晚之前识别它们。
              </p>

              <h3>第一步：初次接触</h3>
              <p>
                这些骗局高度协调，通常从通过短信、社交媒体或交友应用程序的主动联系开始。随着时间的推移，骗子建立信任，并逐步引入看起来可信且低风险的加密货币投资机会。
              </p>
              <p>
                平台从来不是他们最先展示给你的东西。关系先行——有时是数周甚至数月的日常对话、共同兴趣和情感联系。
              </p>

              <h3>第二步：平台演示</h3>
              <p>
                一旦建立了信任，你的联系人会主动展示他们是如何投资的。他们引导你访问一个特定的平台——一个你从未听说过的平台，通过他们发送的链接访问，或者在官方应用商店之外下载的应用程序。
              </p>
              <p>
                受害者经常被一步步引导，通过虚假交易应用、克隆的交易所网站或显示伪造收益的模拟账户来"学习"加密货币投资。
              </p>

              <h3>第三步：证明</h3>
              <p>
                你存入一小笔钱。你看着它增长。你提取了一小笔钱——而且成功了。这都是精心设计的。
              </p>

              {/* 醒目引用 */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">精心设计</p>
                <p className="text-sm text-slate-600">
                  账户余额增加，交易看起来正在执行，小额提现也被允许，以强化合法性的假象。随着信心的建立，受害者被鼓励投入更多资金。
                </p>
              </div>

              <h3>第四步：陷阱</h3>
              <p>
                当你尝试进行大额提现时，平台会制造障碍。税务冻结。合规验证。"流动性费用"。当受害者试图提现时，平台增加阻力，要求额外支付，将其包装为税费、合规检查、升级或验证费用——让受害者持续付款，而资金则被转移走。
              </p>

              <h3>第五步：消失</h3>
              <p>
                一旦他们榨取了最大限度的资金，平台就会消失——连同你的联系人、他们的个人资料以及所有联系方式。
              </p>

              {/* 文中行动号召 */}
              <div className="not-prose my-10 bg-brand-50 border border-brand-200 rounded-xl p-6 text-center">
                <AlertTriangle className="mx-auto text-brand-600 mb-2" size={24} />
                <p className="font-display font-bold text-brand-800 mb-1">怀疑自己可能在使用虚假平台？</p>
                <p className="text-sm text-brand-600 mb-4">在24小时内获得免费、保密的案件评估。无义务，无预付费用。</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  获取免费案件评估 <ArrowRight size={14} />
                </Link>
              </div>

              {/* 10个警告信号 */}
              <h2 id="warning-signs">虚假加密货币交易平台的10个警告信号</h2>

              <h3>1. 你是被网上认识的人引导到那里的</h3>
              <p>
                合法平台不需要有人亲自招募你。如果一个你在网上认识的人——尤其是一个对你的财务状况异常感兴趣的人——把你引导到一个特定的平台，请将此视为严重的危险信号。
              </p>

              <h3>2. 应用不在官方应用商店中</h3>
              <p>
                Coinbase、Kraken 和 Binance 等真正的交易所可在 Apple App Store 和 Google Play 上下载，并拥有数千条经过验证的评价。虚假平台通常要求你：
              </p>
              <ul>
                <li>直接从链接下载APK文件</li>
                <li>使用没有应用商店列表的网页浏览器应用</li>
                <li>安装"特殊版本"以获得更高回报</li>
              </ul>

              <h3>3. 网址看起来几乎正确</h3>
              <p>
                欺诈者注册与合法交易所非常相似的域名。常见手段包括：
              </p>
              <ul>
                <li>添加单词：<code>coinbase-pro-trading.com</code></li>
                <li>更改后缀：<code>binance.cc</code> 而非 <code>binance.com</code></li>
                <li>使用连字符：<code>kraken-exchange.net</code></li>
              </ul>
              <p>
                务必对照官方网站验证确切的URL。直接收藏合法交易所的网址。
              </p>

              <h3>4. 回报有保证或持续偏高</h3>
              <p>
                没有合法投资能保证回报。根据联邦贸易委员会的说法，当你听到加密货币"有保证"的回报时，你可能正在与一个不值得信任的个人或企业打交道。
              </p>
              <p>
                虚假平台通常显示每月10-40%的回报率——这在真实市场中是不可能持续的数字。
              </p>

              <h3>5. 提现需要额外付款</h3>

              {/* 醒目引用 */}
              <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <p className="text-xl font-display font-bold text-red-900 mb-2">骗局的首要标志</p>
                <p className="text-sm text-red-700">
                  要求额外的"费用"或"验证付款"永远不会让你获得账户访问权限。每次付款都会带来新的借口，随着受害者试图追回存款，损失不断增加。
                </p>
              </div>

              <p>
                合法交易所<strong>绝不</strong>会要求你存入更多资金才能提取现有资金。如果你遇到以下任何情况：
              </p>
              <ul>
                <li>"需要缴纳税款才能释放资金"</li>
                <li>"合规验证费"</li>
                <li>"流动性保证金以处理提现"</li>
                <li>"反洗钱审查费"</li>
              </ul>
              <p>
                <strong>你正在被骗。立即停止所有付款。</strong>
              </p>

              <h3>6. 客户支持仅通过聊天</h3>
              <p>
                虚假平台通常没有电话号码、没有实际地址、没有可验证的公司注册信息——仅通过平台内聊天或Telegram提供支持。真正的交易所拥有可验证的公司注册、公开地址和多种联系渠道。
              </p>

              <h3>7. 在行业数据库中找不到该平台</h3>
              <p>
                在以下数据库中核查该平台：
              </p>
              <ul>
                <li><strong>CoinGecko</strong> 和 <strong>CoinMarketCap</strong> ——合法交易所都会被收录</li>
                <li><strong>DFPI Scam Tracker</strong>（加州金融保护与创新部）</li>
                <li><strong>FCA Register</strong>（英国金融行为监管局）</li>
                <li><strong>FINRA BrokerCheck</strong>（美国）</li>
              </ul>
              <p>
                如果该平台未出现在任何监管数据库中，它就不是注册的金融服务机构。
              </p>

              <h3>8. AI生成的个人资料和深度伪造</h3>

              {/* 醒目引用 */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">4.5倍的资金</p>
                <p className="text-sm text-slate-600">
                  与传统骗局相比，AI驱动的骗局每次操作榨取的资金多出4.5倍。在2026年，向你介绍平台的人可能根本不是真人。
                </p>
              </div>

              <p>
                AI生成角色的警告信号：
              </p>
              <ul>
                <li>个人照片看起来略显不自然（AI生成的面孔）</li>
                <li>视频通话是预先录制的或使用了深度伪造技术</li>
                <li>脚本化的对话感觉略有不对</li>
                <li>拒绝进行自发的实时视频通话</li>
              </ul>

              <h3>9. 施压要求追加投资</h3>
              <p>
                合法的投资顾问不会给你施压。虚假平台运营者制造紧迫感：
              </p>
              <ul>
                <li>"这个交易窗口将在48小时后关闭"</li>
                <li>"如果你现在不追加资金，你就会错过牛市"</li>
                <li>"我要投入50,000美元——你也应该这样做"</li>
              </ul>
              <p>
                这种心理施压是为了压制你的理性判断而精心设计的。
              </p>

              <h3>10. 没有可追溯的交易历史</h3>
              <p>
                当你将加密货币发送到虚假平台时，资金会立即转出。在真正的交易所，你的资金会留在你的账户中。
              </p>
              <p>
                你可以验证这一点：使用我们免费的<Link href={`${base}/wallet-tracker`} className="text-brand-600 font-semibold hover:underline">钱包追踪器</Link>来检查目标地址。如果转入平台钱包的资金立即转移到其他地址，而不是留在平台储备中，你就是在与骗局打交道。
              </p>

              {/* 技术危险信号 */}
              <h2 id="technical-red-flags">技术危险信号</h2>
              <p>
                对于熟悉区块链分析的人：
              </p>
              <p>
                <strong>在链上检查钱包地址。</strong>合法交易所维护着拥有数千笔交易且持续多年的大型储备钱包。诈骗钱包通常：
              </p>
              <ul>
                <li>最近创建（几天或几周前）</li>
                <li>显示出接收资金后立即转出的模式</li>
                <li>没有长期交易历史</li>
              </ul>
              <p>
                <strong>使用我们免费的<Link href={`${base}/scam-checker`} className="text-brand-600 font-semibold hover:underline">诈骗检查器</Link>。</strong>我们维护着一个已知欺诈地址数据库，并与Chainabuse报告和OFAC制裁名单进行交叉比对。
              </p>
              <p>
                <strong>查找交易所标识。</strong>通过我们的<Link href={`${base}/graph-tracer`} className="text-brand-600 font-semibold hover:underline">图谱追踪器</Link>运行目标地址。如果资金立即流向隐私混币器或不受监管的离岸交易所，而不是符合KYC规定的主要平台，这就是欺诈的有力证据。
              </p>

              {/* 真实案例 */}
              <h2 id="real-case">真实案例：佐治亚州男子损失164,000美元</h2>
              <p>
                2025年6月，一名佐治亚州男子在Facebook上认识了一位自称"Hnin Phyu"的女性。她很快将他们的对话转移到了Telegram，并向他介绍了加密货币投资。他信任她，按照她的指示在Crypto.com和一个数字钱包服务上设置了账户，然后将资金转入了一个显示伪造利润的虚假交易网站。
              </p>
              <p>
                当他试图提取资金时，骗子告诉他需要额外支付50,000美元的税费才能释放资金。总损失超过164,000美元。
              </p>
              <p>
                FBI于2025年10月启动的<strong>Operation Silent Freeze</strong>行动专门针对加密货币欺诈计划——但预防仍然远比追回更有效。
              </p>

              {/* 如果已经汇款 */}
              <h2 id="already-sent">如果你已经汇款</h2>

              <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <p className="text-xl font-display font-bold text-red-900 mb-2">立即停止</p>
                <p className="text-sm text-red-700">
                  无论被告知什么，都不要再发送任何资金。每一笔额外付款都直接流入骗子手中。
                </p>
              </div>

              <p>
                <strong>保存所有证据：</strong>
              </p>
              <ul>
                <li>平台及账户余额的截图</li>
                <li>与介绍你的人的所有聊天记录</li>
                <li>交易记录和钱包地址</li>
                <li>平台URL和所有账户凭证</li>
              </ul>

              <p>
                <strong>立即举报：</strong>
              </p>
              <ul>
                <li>FBI IC3，网址 <strong>ic3.gov</strong>（附上所有钱包地址）</li>
                <li>FTC，网址 <strong>reportfraud.ftc.gov</strong></li>
                <li>你所在州的总检察长</li>
              </ul>

              <p>
                <strong>进行区块链取证调查。</strong>数据显示，冻结资产是帮助止损的最佳步骤。在许多资金仍在攻击者钱包控制下的案例中，约75%的资产被成功冻结。
              </p>
              <p>
                时间至关重要。每过一个小时，资金就会在区块链上进一步转移，变得更难追踪和冻结。
              </p>

              {/* 获取帮助 */}
              <h2 id="getting-help">获取帮助</h2>
              <p>
                如果你是虚假交易平台的受害者，<strong>LedgerHound</strong> 提供经认证的区块链取证调查服务。
              </p>

              <div className="not-prose my-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
                <p className="font-display font-bold text-slate-900 mb-4">我们将：</p>
                <div className="space-y-3">
                  {[
                    '在所有主要区块链上追踪你的资金',
                    '识别哪些交易所接收了被盗的加密货币',
                    '制作一份可用于法庭的取证报告，记录完整的资金流向',
                    '协助你的律师进行传票程序',
                    '提供俄语、英语、西班牙语、中文、法语和阿拉伯语的咨询服务',
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
                  获取免费案件评估 →
                </Link>
              </p>
              <p>
                免费。保密。无义务。24小时内回复。
              </p>
    </>
  );
}
