import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield } from 'lucide-react';

export default function ContentZh({ base }: { base: string }) {
  return (
    <>
      {/* 引言 */}
      <p className="text-lg text-slate-700 leading-relaxed">
        您将加密货币发送到了一个您认为是合法的投资平台、交易所或联系人——然后资金就消失了。您的第一个问题很可能是：<em>加密货币真的能被追踪吗？</em>
      </p>
      <p>
        答案是，在大多数情况下，可以。
      </p>
      <p>
        尽管人们普遍认为加密货币是匿名且不可追踪的，但对于大多数主流区块链来说，事实恰恰相反。每一笔比特币交易、每一次以太坊转账、每一笔USDT的流动——全部被永久记录在一个全世界任何人都可以查阅的公共账本中，调查人员也不例外。
      </p>
      <p>
        本指南将详细说明加密货币追踪的工作原理、调查人员的具体操作步骤，以及您现在可以采取哪些措施来最大限度地提高资金追回的可能性。
      </p>

      {/* 第一节 */}
      <h2 id="blockchain-transparency">区块链透明性的基本事实</h2>
      <p>
        比特币和大多数主流加密货币是<strong>假名的，而非匿名的</strong>。这是一个关键区别。
      </p>
      <p>
        您的钱包地址中不包含您的姓名。但您进行的每一笔交易——发送给谁、金额多少、何时发生——都被永久写入一个无法篡改或删除的公共区块链。
      </p>

      {/* 引用框 */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">假名，非匿名</p>
        <p className="text-sm text-slate-600">
          尽管早期人们普遍认为加密货币具有匿名性，但大多数加密货币交易都可以通过区块链分析进行追踪。每一笔价值转移都被永久记录在比特币或以太坊等公共账本上。
        </p>
      </div>

      <p>
        这种彻底的透明性彻底改变了金融调查领域。挑战不在于交易是否可见——而在于如何解读这些交易的含义，以及如何将假名地址与现实世界的身份关联起来。
      </p>

      {/* 第二节 */}
      <h2 id="whats-visible">区块链上可见的信息</h2>
      <p>
        当您发送加密货币时，以下信息会被永久记录：
      </p>

      {/* 信息框 */}
      <div className="not-prose my-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-blue-700 font-display font-bold text-lg">
          <Shield size={20} />
          区块链记录的内容
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">始终可见：</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> 发送方钱包地址</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> 接收方钱包地址</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> 转账金额</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> 日期和时间（精确的区块时间戳）</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> 交易哈希（唯一标识符）</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> 支付的网络手续费</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">有时可获取：</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> 发送方的IP地址（在广播时被网络节点捕获）</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> 地理位置数据（来自IP地址）</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> 与同一人控制的其他地址的关联</li>
          </ul>
        </div>
      </div>

      <p>
        这意味着，仅凭一个钱包地址或交易哈希，调查人员就可以还原资金来源和去向的完整历史。
      </p>

      {/* 第三节 */}
      <h2 id="how-tracing-works">详解：加密货币追踪的实际运作方式</h2>

      <h3>第一步：信息收集——整理初始证据</h3>
      <p>
        每项调查都从受害者能够提供的信息开始：
      </p>
      <ul>
        <li><strong>交易哈希</strong>——您付款的唯一标识符（形如 <code>0x7f3a...</code>）</li>
        <li><strong>钱包地址</strong>——您将资金发送到的地址</li>
        <li><strong>平台名称</strong>——诈骗网站或应用</li>
        <li><strong>日期和金额</strong>——每笔转账的时间</li>
        <li><strong>截图</strong>——平台截图、通讯记录、您的账户截图</li>
      </ul>
      <p>
        即使您只拥有其中一项信息，追踪通常也可以开始。在大多数情况下，仅凭一个钱包地址或交易哈希就足以启动调查。
      </p>

      <h3>第二步：交易映射</h3>
      <p>
        调查人员将起始地址导入区块链情报平台（如Chainalysis Reactor、TRM Labs、Elliptic等），并开始映射与该地址相关的每一笔交易。
      </p>

      {/* 引用框 */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">可视化资金流向图</p>
        <p className="text-sm text-slate-600">
          交易数据被转换为可视化地图和流程图，展示目标对象与已知交易所及其他实体的交互，追踪资金流转至最终目的地。可视化映射使识别洗钱中常用的分层和剥离链等模式变得更加容易。
        </p>
      </div>

      <p>
        这将生成一个可视化图表——与我们的免费Graph Tracer工具完全相同——展示资金在多个钱包之间的流动路径。
      </p>

      <h3>第三步：聚类分析</h3>
      <p>
        一个地址很少能反映全貌。犯罪分子会使用多个钱包来混淆追踪线索。聚类分析将可能由同一人控制的地址归为一组。
      </p>
      <p>
        一个聚类是由同一个人或实体控制的一组加密货币地址。将调查范围从一个地址扩展到更大的聚类，可以显著增加可用于去匿名化和资产追踪的证据量。
      </p>
      <p>
        常见的聚类技术包括：
      </p>
      <ul>
        <li><strong>共同花费分析</strong>——在同一笔交易中使用的多个地址</li>
        <li><strong>地址复用</strong>——同一地址被反复使用</li>
        <li><strong>时序分析</strong>——交易呈现一定模式</li>
      </ul>

      <h3>第四步：交易所识别——关键突破口</h3>
      <p>
        这是调查变得可执行的阶段。当被盗资金流入一个<strong>合规KYC交易所</strong>（如Coinbase、Binance、Kraken、OKX等）时，该交易所依法持有账户所有者的身份验证信息。
      </p>

      {/* 引用框 */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">传票通道</p>
        <p className="text-sm text-slate-600">
          区块链情报工具可以识别与Coinbase和Binance等交易所的交易。对合规KYC/AML实体发出传票，要求其提供比特币所有者的身份证件——从而将假名地址转化为真实身份。
        </p>
      </div>

      <p>
        一旦调查人员确定了哪个交易所接收了资金，律师就可以提交传票——迫使交易所披露账户持有人的姓名、地址、身份证件和银行信息。
      </p>

      <h3>第五步：归因分析</h3>
      <p>
        专业的区块链情报平台维护着数百万个已标注钱包地址的数据库——包括交易所、混币器、DeFi协议、已知犯罪实体和标记地址。
      </p>
      <p>
        区块链取证专家使用开源工具、商业工具和专有工具的组合。所有取证工作的基础是区块链浏览器。高级取证浏览器包含额外的元数据：钱包标签（例如"Binance热钱包"、"已标记混币器"）、基于已知欺诈关联的风险评分。
      </p>
      <p>
        当被盗资金触及其中一个已标注的地址时，调查人员可以立即识别涉及的实体。
      </p>

      <h3>第六步：IP地址情报</h3>
      <p>
        这是一种鲜为人知但非常有效的追踪方法。当一笔交易被广播到区块链网络时，发送方计算机的IP地址可能会被区块链情报公司运营的监控节点捕获。
      </p>
      <p>
        隐私穿透元数据通过区块链监控系统收集，这些系统运行着节点网络，用于"监听"和"嗅探"与特定交易相关的互联网协议（IP）地址。IP地址在可用时，可能提供有关交易发生时目标对象地理位置的信息。
      </p>
      <p>
        这可以将诈骗者定位到特定的城市或国家——这对于国际执法协调至关重要。
      </p>

      <h3>第七步：取证报告</h3>
      <p>
        所有信息被整合为一份可用于法庭的取证报告，包含：
      </p>
      <ul>
        <li>从受害者到最终目的地的完整交易图</li>
        <li>所有已识别的钱包地址</li>
        <li>交易所识别结果及传票建议</li>
        <li>风险评分和实体归因</li>
        <li>调查员认证和方法学文档</li>
      </ul>

      {/* 第四节 */}
      <h2 id="obfuscation-techniques">常见混淆技术——以及调查人员如何破解</h2>
      <p>
        诈骗者知道调查人员的存在。他们会使用各种技术来隐藏踪迹。以下是他们的常用手段——以及取证技术如何应对。
      </p>

      <h3>混币器和搅拌器（如Tornado Cash）</h3>
      <p>
        <strong>运作方式：</strong>将来自多个来源的加密货币汇集在一起，然后重新分配等额资金，以此切断交易链路。
      </p>
      <p>
        <strong>调查人员的应对：</strong>现代反混币技术通过分析混币器输入和输出的时间、金额和模式，以概率方法追踪通过混币服务的资金。Crystal Expert的自动反混币功能分析混币器的输入和输出，可从混币服务中推导出多达五条候选资金路径。
      </p>
      <p>
        此外，Tornado Cash在2022年被OFAC制裁——任何接收来自Tornado Cash资金的交易所都必须根据美国制裁法冻结这些资金。
      </p>

      <h3>跨链转移（链间跳转）</h3>
      <p>
        <strong>运作方式：</strong>将比特币兑换为以太坊，再兑换为USDT，再兑换为BNB——在不同区块链之间跳转以迷惑调查人员。
      </p>
      <p>
        <strong>调查人员的应对：</strong>现代工具可以自动进行跨链追踪。TRM Labs等区块链情报平台能够跟踪资金流向、检测可疑行为，并将链上活动与现实世界的行为人关联——尤其是结合链下情报使用时。
      </p>

      <h3>剥离链</h3>
      <p>
        <strong>运作方式：</strong>通过一长串钱包依次发送资金，每个钱包将大部分资金传递给下一个，同时保留少量——就像剥洋葱一样。
      </p>
      <p>
        <strong>调查人员的应对：</strong>自动化交易映射工具会自动跟踪剥离链，无论经过多少跳。这种模式本身就是一个危险信号，反而使资金更容易被识别。
      </p>

      <h3>隐私币（门罗币）</h3>
      <p>
        <strong>运作方式：</strong>使用门罗币（XMR），该币种内置隐私功能，可以隐藏交易细节。
      </p>
      <p>
        <strong>调查人员的应对：</strong>这是最困难的场景。纯门罗币交易极难追踪。然而，大多数诈骗者最终会将其兑换为比特币或稳定币以便套现——而这一兑换节点是可追踪的。
      </p>

      {/* 文中CTA */}
      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">需要专业追踪帮助？</h3>
        <p className="text-brand-100 text-sm mb-5">提交您的案件详情，获取免费的初步评估和追踪方案。</p>
        <Link
          href={`${base}/free-evaluation`}
          className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
        >
          获取免费评估 <ArrowRight size={14} />
        </Link>
      </div>

      {/* 第五节 */}
      <h2 id="what-you-need">启动追踪需要准备什么</h2>
      <p>
        您不需要准备以下所有信息——但您提供得越多，调查就越快、越完整：
      </p>

      {/* 清单框 */}
      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          调查清单
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">必要信息（至少提供一项）：</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 您发送资金的钱包地址</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 交易哈希 / TX ID</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 您使用的平台或交易所名称</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">有帮助的信息：</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 每笔转账的日期和准确金额</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 您在该平台账户的截图</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 与诈骗者的通讯记录</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 平台网址及任何注册信息</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">额外加分项：</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 诈骗者提供的任何姓名、电话或邮箱</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 诈骗中使用的社交媒体账号</li>
          </ul>
        </div>
      </div>

      {/* 第六节 */}
      <h2 id="how-long">追踪需要多长时间？</h2>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="font-bold text-slate-800 text-sm mb-1">基础追踪</p>
          <p className="text-xs text-slate-500 mb-2">单一区块链，路径清晰</p>
          <p className="text-2xl font-display font-bold text-brand-600">24-48小时</p>
          <p className="text-xs text-slate-500 mt-1">提供初步报告</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="font-bold text-slate-800 text-sm mb-1">全面调查</p>
          <p className="text-xs text-slate-500 mb-2">多链追踪，复杂路由</p>
          <p className="text-2xl font-display font-bold text-brand-600">3-7天</p>
          <p className="text-xs text-slate-500 mt-1">工作日</p>
        </div>
      </div>

      {/* 引用框 */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">时间至关重要</p>
        <p className="text-sm text-slate-600">
          在72小时内采取行动将大大提高追回资金的可能性。追踪启动得越早，在资金被完全变现之前找到资金、在账户仍然活跃时联系交易所、以及提交紧急冻结请求的机会就越大。
        </p>
      </div>

      {/* 第七节 */}
      <h2 id="free-tools">您现在就可以使用的免费工具</h2>
      <p>
        在聘请专业调查人员之前，您可以使用免费工具自行开始收集信息：
      </p>

      <h3>区块链浏览器</h3>
      <ul>
        <li><strong>Etherscan.io</strong>——以太坊、ERC-20代币、NFT</li>
        <li><strong>Blockchain.com</strong>——比特币</li>
        <li><strong>BscScan.com</strong>——BNB Chain</li>
        <li><strong>Tronscan.org</strong>——Tron/USDT</li>
      </ul>
      <p>
        输入任何钱包地址或交易哈希即可查看完整的交易历史。
      </p>

      <h3>LedgerHound免费工具</h3>
      <ul>
        <li><strong><Link href={`${base}/tracker`} className="text-brand-600 hover:text-brand-700">钱包追踪器</Link></strong>——输入任何以太坊地址，查看完整的交易历史和分析数据</li>
        <li><strong><Link href={`${base}/graph-tracer`} className="text-brand-600 hover:text-brand-700">图形追踪器</Link></strong>——以交互式图表可视化资金流向，识别已知交易所</li>
      </ul>
      <p>
        这些工具向您展示的是与专业调查人员起步时相同的链上数据——但专业级追踪需要专有归因数据库和经认证的方法论才能用于法律用途。
      </p>

      {/* 第八节 */}
      <h2 id="when-to-hire">何时需要专业调查</h2>
      <p>
        免费工具只是起点。在以下情况下，专业区块链取证是必要的：
      </p>
      <ul>
        <li><strong>您需要法律级别的证据</strong>——法庭要求经认证的方法论，而非截图</li>
        <li><strong>资金经过混币或跨链转移</strong>——需要专业的反混币工具</li>
        <li><strong>您需要向交易所发出传票</strong>——律师需要一份识别目标的取证报告</li>
        <li><strong>执法部门已介入</strong>——专业报告具有DIY分析所不具备的权威性</li>
        <li><strong>涉案金额较大</strong>——如果您损失了10,000美元或以上，专业调查通常物有所值</li>
      </ul>

      {/* 第九节 */}
      <h2 id="what-happens-after">追踪之后会发生什么</h2>
      <p>
        成功的取证追踪可以确定资金的<em>去向</em>。资金追回则需要法律行动：
      </p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          追踪后的追回步骤
        </div>

        <div className="space-y-5">
          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
              交易所传票
            </p>
            <p className="text-sm text-slate-600 ml-8">您的律师向已识别的交易所发出传票，要求提供账户持有人信息。大多数主流交易所在2-4周内会予以配合。</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
              紧急冻结请求
            </p>
            <p className="text-sm text-slate-600 ml-8">许多交易所在收到专业取证报告和执法机关转介后，会在正式传票之前自愿冻结相关账户。</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
              民事诉讼
            </p>
            <p className="text-sm text-slate-600 ml-8">在确认账户持有人身份后，可以提起欺诈、财产侵占和不当得利等民事索赔。</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
              执法转介
            </p>
            <p className="text-sm text-slate-600 ml-8">FBI IC3和各州执法机构会根据取证报告采取行动。重大案件可能有资格纳入FBI的资产追回团队（RAT），该团队拥有紧急资产冻结权限。</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">5</span>
              司法部没收程序
            </p>
            <p className="text-sm text-slate-600 ml-8">在涉及有组织犯罪的案件中，司法部的没收程序可以将追回的资金分配给受害者。</p>
          </div>
        </div>
      </div>

      {/* 获取帮助 */}
      <h2>立即开始追踪</h2>
      <p>
        <strong>LedgerHound</strong>为加密货币盗窃和欺诈受害者提供经认证的区块链取证调查服务。我们的团队：
      </p>
      <ul>
        <li>追踪所有主流区块链上的被盗资金</li>
        <li>识别接收您资金的交易所和实体</li>
        <li>在48-72小时内出具可用于法庭的取证报告</li>
        <li>支持律师传票流程和执法转介</li>
        <li>提供俄语、英语、西班牙语、中文、法语和阿拉伯语咨询服务</li>
      </ul>
    </>
  );
}
